import { describe, expect, it, vi } from 'vitest';
import { runDailyStats } from '../../../src/stats/daily.js';
import type { Env } from '../../../src/types.js';

interface Fixtures {
  totals: { total: number; unique_ips: number; unique_asns: number } | null;
  categories?: Array<{ key: string; n: number }>;
  paths?: Array<{ key: string; n: number }>;
  asns?: Array<{ asn: number; asn_org: string | null; n: number }>;
  signals?: Array<{ signal: string; n: number }>;
  failFirst?: boolean;
}

interface PreparedCall {
  sql: string;
  args: unknown[];
}

function buildEnv(fx: Fixtures) {
  const calls: PreparedCall[] = [];
  const run = vi.fn().mockResolvedValue({ success: true });

  const prepare = vi.fn((sql: string) => ({
    bind: (...args: unknown[]) => {
      calls.push({ sql, args });
      return {
        first: async () => {
          if (fx.failFirst) throw new Error('D1 unavailable');
          return fx.totals;
        },
        all: async () => {
          if (sql.includes('json_each')) return { results: fx.signals ?? [] };
          if (sql.includes('GROUP BY category')) return { results: fx.categories ?? [] };
          if (sql.includes('GROUP BY path')) return { results: fx.paths ?? [] };
          if (sql.includes('GROUP BY asn')) return { results: fx.asns ?? [] };
          return { results: [] };
        },
        run,
      };
    },
  }));

  const env = {
    DB: { prepare } as unknown as D1Database,
    PAYLOADS: { delete: vi.fn() } as unknown as R2Bucket,
    BODY_R2_THRESHOLD: '8192',
    BODY_READ_LIMIT: '65536',
    RETENTION_DAYS: '30',
    GC_BATCH_SIZE: '1000',
  } satisfies Env;

  return { env, prepare, run, calls };
}

// 2026-05-17T00:00:05Z trigger -> aggregates the previous full UTC day.
const TRIGGER_MS = Date.UTC(2026, 4, 17, 0, 0, 5);
const DAY_END = Math.floor(Date.UTC(2026, 4, 17, 0, 0, 0) / 1000);
const DAY_START = DAY_END - 86_400;
const EXPECTED_DATE = '2026-05-16';

function insertCall(calls: PreparedCall[]): PreparedCall | undefined {
  return calls.find((c) => c.sql.includes('INSERT INTO daily_stats'));
}

describe('runDailyStats', () => {
  it('aggregates the previous UTC day over [dayStart, dayEnd)', async () => {
    const { env, calls } = buildEnv({ totals: { total: 1, unique_ips: 1, unique_asns: 1 } });
    await runDailyStats(env, TRIGGER_MS);

    const totalsCall = calls.find((c) => c.sql.includes('COUNT(*)            AS total'));
    expect(totalsCall?.args).toEqual([DAY_START, DAY_END]);
  });

  it('skips the upsert when the day had no requests', async () => {
    const { env, run, calls } = buildEnv({ totals: { total: 0, unique_ips: 0, unique_asns: 0 } });
    await runDailyStats(env, TRIGGER_MS);

    expect(insertCall(calls)).toBeUndefined();
    expect(run).not.toHaveBeenCalled();
  });

  it('upserts a daily_stats row with aggregated JSON columns', async () => {
    const { env, run, calls } = buildEnv({
      totals: { total: 5, unique_ips: 3, unique_asns: 2 },
      categories: [
        { key: 'cms-auth', n: 3 },
        { key: 'config-leak', n: 2 },
      ],
      paths: [{ key: '/wp-login.php', n: 4 }],
      asns: [{ asn: 64500, asn_org: 'Example Net', n: 5 }],
      signals: [
        { signal: 'sqli', n: 2 },
        { signal: 'xss', n: 1 },
      ],
    });

    await runDailyStats(env, TRIGGER_MS);

    const ins = insertCall(calls);
    expect(ins).toBeDefined();
    expect(run).toHaveBeenCalledTimes(1);

    const [date, total, uniqIps, uniqAsns, cats, paths, asns, signals] = ins?.args as [
      string,
      number,
      number,
      number,
      string,
      string,
      string,
      string,
    ];

    expect(date).toBe(EXPECTED_DATE);
    expect(total).toBe(5);
    expect(uniqIps).toBe(3);
    expect(uniqAsns).toBe(2);
    expect(JSON.parse(cats)).toEqual([
      { value: 'cms-auth', count: 3 },
      { value: 'config-leak', count: 2 },
    ]);
    expect(JSON.parse(paths)).toEqual([{ value: '/wp-login.php', count: 4 }]);
    expect(JSON.parse(asns)).toEqual([{ asn: 64500, asn_org: 'Example Net', count: 5 }]);
    expect(JSON.parse(signals)).toEqual({ sqli: 2, xss: 1 });
  });

  it('uses the ON CONFLICT upsert form so re-runs are idempotent', async () => {
    const { env, calls } = buildEnv({ totals: { total: 1, unique_ips: 1, unique_asns: 1 } });
    await runDailyStats(env, TRIGGER_MS);
    expect(insertCall(calls)?.sql).toContain('ON CONFLICT(date) DO UPDATE');
  });

  it('throws and logs when a query fails', async () => {
    const { env } = buildEnv({ totals: null, failFirst: true });
    await expect(runDailyStats(env, TRIGGER_MS)).rejects.toThrow('D1 unavailable');
  });
});
