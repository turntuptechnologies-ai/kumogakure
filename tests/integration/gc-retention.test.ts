import { env } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import { runDailyGc } from '../../src/gc/cron.js';
import type { Env } from '../../src/types.js';

// Runs the retention GC against the real (miniflare) D1 and R2 bindings, so
// the SQL it issues is actually executed — the unit tests only mock D1.

const SCHEDULED_MS = Date.UTC(2026, 4, 2, 0, 0, 0); // cron for 2026-05-02 00:00 UTC
const YESTERDAY = Date.UTC(2026, 4, 1, 0, 0, 0) / 1000;

async function seed(prefix: string, rows: { suffix: string; ts: number; payload: boolean }[]) {
  for (const row of rows) {
    const id = `${prefix}-${row.suffix}`;
    const key = row.payload ? `test/${id}.json.gz` : null;
    await env.DB.prepare(
      "INSERT INTO requests (id, ts, method, path, status, r2_key) VALUES (?, ?, 'GET', '/', 404, ?)",
    )
      .bind(id, row.ts, key)
      .run();
    if (key) await env.PAYLOADS.put(key, 'payload');
  }
}

async function remainingIds(prefix: string): Promise<string[]> {
  const { results } = await env.DB.prepare('SELECT id FROM requests WHERE id LIKE ? ORDER BY id')
    .bind(`${prefix}-%`)
    .all<{ id: string }>();
  return results.map((r) => r.id);
}

async function payloadExists(prefix: string, suffix: string): Promise<boolean> {
  return (await env.PAYLOADS.head(`test/${prefix}-${suffix}.json.gz`)) !== null;
}

function gcEnv(overrides: Partial<Env> = {}): Env {
  return { ...env, RETENTION_DAYS: '1', GC_BATCH_SIZE: '2', ...overrides } as Env;
}

describe('runDailyGc against D1 / R2', () => {
  it('sweeps only rows older than the scheduled-time cutoff, across pages (#222, #224)', async () => {
    const p = 'gc-cutoff';
    await seed(p, [
      { suffix: 'old1', ts: YESTERDAY - 3 * 3600, payload: true },
      { suffix: 'old2', ts: YESTERDAY - 2 * 3600, payload: true },
      { suffix: 'old3', ts: YESTERDAY - 3600, payload: true },
      { suffix: 'old4', ts: YESTERDAY - 60, payload: false },
      // Yesterday's first seconds: inside the stats window, must survive even
      // though the real clock is far past the scheduled time.
      { suffix: 'y0', ts: YESTERDAY, payload: true },
      { suffix: 'y3', ts: YESTERDAY + 3, payload: false },
    ]);

    await runDailyGc(gcEnv(), SCHEDULED_MS);

    expect(await remainingIds(p)).toEqual([`${p}-y0`, `${p}-y3`]);
    for (const s of ['old1', 'old2', 'old3']) expect(await payloadExists(p, s), s).toBe(false);
    expect(await payloadExists(p, 'y0')).toBe(true);
  });

  it('keeps rows with payloads when an R2 batch fails, and the next run finishes the job (#223)', async () => {
    const p = 'gc-r2fail';
    await seed(p, [
      { suffix: 'a', ts: YESTERDAY - 300, payload: true },
      { suffix: 'b', ts: YESTERDAY - 200, payload: true },
      { suffix: 'c', ts: YESTERDAY - 150, payload: false },
      { suffix: 'd', ts: YESTERDAY - 100, payload: true },
    ]);
    let calls = 0;
    const flakyPayloads = {
      delete: async (keys: string | string[]) => {
        calls++;
        if (calls === 2) throw new Error('R2 unavailable');
        return env.PAYLOADS.delete(keys);
      },
    } as unknown as R2Bucket;

    await runDailyGc(gcEnv({ PAYLOADS: flakyPayloads }), SCHEDULED_MS);

    // Page 1 (a, b) was deleted from R2, page 2 (d) failed: every row with a
    // payload stays in D1 so nothing is orphaned; the payload-less row goes.
    expect(await remainingIds(p)).toEqual([`${p}-a`, `${p}-b`, `${p}-d`]);
    expect(await payloadExists(p, 'd')).toBe(true);

    await runDailyGc(gcEnv(), SCHEDULED_MS);

    expect(await remainingIds(p)).toEqual([]);
    expect(await payloadExists(p, 'd')).toBe(false);
  });
});
