import { describe, expect, it, vi } from 'vitest';
import { runDailyGc } from '../../../src/gc/cron.js';
import type { Env } from '../../../src/types.js';

interface AllResult<T> {
  results: T[];
}

function buildEnv(
  retentionDays: string,
  expiredKeyBatches: Array<Array<{ r2_key: string }>>,
  options: { batchSize?: string } = {},
) {
  const all = vi.fn();
  for (const batch of expiredKeyBatches) {
    all.mockResolvedValueOnce({ results: batch } satisfies AllResult<{ r2_key: string }>);
  }
  all.mockResolvedValue({ results: [] } satisfies AllResult<{ r2_key: string }>);

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
    GC_BATCH_SIZE: options.batchSize ?? '1000',
  } satisfies Env;
  return { env, prepare, bind, all, run, r2Delete };
}

describe('runDailyGc', () => {
  it('deletes expired R2 objects via a single batched call and sweeps D1', async () => {
    const { env, prepare, run, r2Delete } = buildEnv('30', [
      [{ r2_key: 'requests/2026/04/01/a.json.gz' }, { r2_key: 'requests/2026/04/02/b.json.gz' }],
    ]);

    await runDailyGc(env);

    // SELECT (single batch, returns < batchSize so loop breaks) + DELETE.
    expect(prepare).toHaveBeenCalledTimes(2);
    expect(prepare.mock.calls[0]?.[0]).toContain('SELECT r2_key');
    expect(prepare.mock.calls[1]?.[0]).toContain('DELETE FROM requests');

    // R2 delete called once with the array form.
    expect(r2Delete).toHaveBeenCalledTimes(1);
    expect(r2Delete).toHaveBeenCalledWith([
      'requests/2026/04/01/a.json.gz',
      'requests/2026/04/02/b.json.gz',
    ]);

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
    const { env, bind } = buildEnv('7', [[]]);
    const before = Math.floor(Date.now() / 1000);
    await runDailyGc(env);
    const after = Math.floor(Date.now() / 1000);
    const cutoff = bind.mock.calls[0]?.[0] as unknown as number;
    const expectedMin = before - 7 * 86400 - 1;
    const expectedMax = after - 7 * 86400 + 1;
    expect(cutoff).toBeGreaterThanOrEqual(expectedMin);
    expect(cutoff).toBeLessThanOrEqual(expectedMax);
  });

  it('continues to the D1 sweep when the R2 batch delete rejects', async () => {
    const { env, run, r2Delete } = buildEnv('30', [
      [{ r2_key: 'requests/2026/04/01/a.json.gz' }, { r2_key: 'requests/2026/04/02/b.json.gz' }],
    ]);
    r2Delete.mockRejectedValueOnce(new Error('R2 unavailable'));

    await expect(runDailyGc(env)).resolves.toBeUndefined();

    expect(r2Delete).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledTimes(1); // D1 sweep still ran.
  });

  it('paginates the scan when results match the batch size', async () => {
    const batchSize = 2;
    const batch1 = [
      { r2_key: 'requests/2026/04/01/a.json.gz' },
      { r2_key: 'requests/2026/04/02/b.json.gz' },
    ];
    const batch2 = [{ r2_key: 'requests/2026/04/03/c.json.gz' }];
    const { env, prepare, bind, r2Delete } = buildEnv('30', [batch1, batch2], {
      batchSize: String(batchSize),
    });

    await runDailyGc(env);

    // First SELECT returned full batch (size = 2), second returned smaller batch (size = 1, < 2 → stop).
    const selectCalls = prepare.mock.calls.filter((call) => String(call[0]).includes('SELECT'));
    expect(selectCalls).toHaveLength(2);

    // Offsets advance: first call uses offset 0, second uses offset 2.
    const bindCalls = bind.mock.calls;
    expect(bindCalls[0]?.[2]).toBe(0);
    expect(bindCalls[1]?.[2]).toBe(2);

    // Two R2 delete batches.
    expect(r2Delete).toHaveBeenCalledTimes(2);
    expect(r2Delete).toHaveBeenNthCalledWith(1, [
      'requests/2026/04/01/a.json.gz',
      'requests/2026/04/02/b.json.gz',
    ]);
    expect(r2Delete).toHaveBeenNthCalledWith(2, ['requests/2026/04/03/c.json.gz']);
  });

  it('skips R2 deletes when no expired payloads exist but still sweeps D1', async () => {
    const { env, run, r2Delete } = buildEnv('30', [[]]);
    await runDailyGc(env);
    expect(r2Delete).not.toHaveBeenCalled();
    expect(run).toHaveBeenCalledTimes(1);
  });
});
