import { describe, expect, it, vi } from 'vitest';
import { runDailyGc } from '../../../src/gc/cron.js';
import type { Env } from '../../../src/types.js';

interface AllResult<T> {
  results: T[];
}

function buildEnv(retentionDays: string, expiredKeys: Array<{ r2_key: string }>) {
  const all = vi.fn().mockResolvedValue({ results: expiredKeys } satisfies AllResult<{
    r2_key: string;
  }>);
  const run = vi.fn().mockResolvedValue({ success: true });
  const bind = vi.fn((..._args: unknown[]) => ({ all, run }));
  const prepare = vi.fn((..._args: unknown[]) => ({ bind }));
  const r2Delete = vi.fn().mockResolvedValue(undefined);
  const env = {
    DB: { prepare } as unknown as D1Database,
    PAYLOADS: { delete: r2Delete } as unknown as R2Bucket,
    BODY_R2_THRESHOLD: '8192',
    BODY_READ_LIMIT: '65536',
    RETENTION_DAYS: retentionDays,
  } satisfies Env;
  return { env, prepare, bind, all, run, r2Delete };
}

describe('runDailyGc', () => {
  it('deletes expired R2 objects and the matching D1 rows', async () => {
    const { env, prepare, bind, run, r2Delete } = buildEnv('30', [
      { r2_key: 'requests/2026/04/01/a.json.gz' },
      { r2_key: 'requests/2026/04/02/b.json.gz' },
    ]);

    await runDailyGc(env);

    expect(prepare).toHaveBeenCalledTimes(2);
    expect(prepare.mock.calls[0]?.[0]).toContain('SELECT r2_key');
    expect(prepare.mock.calls[1]?.[0]).toContain('DELETE FROM requests');

    expect(r2Delete).toHaveBeenCalledTimes(2);
    expect(r2Delete).toHaveBeenCalledWith('requests/2026/04/01/a.json.gz');
    expect(r2Delete).toHaveBeenCalledWith('requests/2026/04/02/b.json.gz');

    expect(bind).toHaveBeenCalled();
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('does nothing when RETENTION_DAYS is invalid', async () => {
    const { env, prepare, r2Delete } = buildEnv('not-a-number', []);
    await runDailyGc(env);
    expect(prepare).not.toHaveBeenCalled();
    expect(r2Delete).not.toHaveBeenCalled();
  });

  it('does nothing when RETENTION_DAYS is zero or negative', async () => {
    const { env, prepare } = buildEnv('0', []);
    await runDailyGc(env);
    expect(prepare).not.toHaveBeenCalled();
  });

  it('passes a cutoff timestamp relative to now to the SELECT query', async () => {
    const { env, bind } = buildEnv('7', []);
    const before = Math.floor(Date.now() / 1000);
    await runDailyGc(env);
    const after = Math.floor(Date.now() / 1000);
    const cutoff = bind.mock.calls[0]?.[0] as unknown as number;
    const expectedMin = before - 7 * 86400 - 1;
    const expectedMax = after - 7 * 86400 + 1;
    expect(cutoff).toBeGreaterThanOrEqual(expectedMin);
    expect(cutoff).toBeLessThanOrEqual(expectedMax);
  });
});
