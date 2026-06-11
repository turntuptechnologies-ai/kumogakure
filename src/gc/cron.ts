import { parsePositiveInt } from '../env.js';
import type { Env } from '../types.js';

const DEFAULT_GC_BATCH_SIZE = 1000;

function resolveBatchSize(raw: string | undefined): number {
  return parsePositiveInt(raw) ?? DEFAULT_GC_BATCH_SIZE;
}

export async function runDailyGc(env: Env): Promise<void> {
  // No safe default for retention: an invalid value skips GC rather than
  // risk deleting against an assumed window.
  const retentionDays = parsePositiveInt(env.RETENTION_DAYS);
  if (retentionDays === undefined) {
    console.log(JSON.stringify({ msg: 'gc_skipped', reason: 'invalid_retention' }));
    return;
  }
  const cutoff = Math.floor(Date.now() / 1000) - retentionDays * 86400;
  const batchSize = resolveBatchSize(env.GC_BATCH_SIZE);
  console.log(
    JSON.stringify({
      msg: 'gc_start',
      cutoff,
      retention_days: retentionDays,
      batch_size: batchSize,
    }),
  );

  try {
    let r2Deleted = 0;
    let totalScanned = 0;
    let offset = 0;

    while (true) {
      const { results } = await env.DB.prepare(
        'SELECT r2_key FROM requests WHERE ts < ? AND r2_key IS NOT NULL LIMIT ? OFFSET ?',
      )
        .bind(cutoff, batchSize, offset)
        .all<{ r2_key: string }>();

      if (results.length === 0) break;

      const keys: string[] = [];
      for (const row of results) {
        if (row.r2_key) keys.push(row.r2_key);
      }

      if (keys.length > 0) {
        try {
          await env.PAYLOADS.delete(keys);
          r2Deleted += keys.length;
        } catch (err) {
          console.error(
            JSON.stringify({
              msg: 'gc_r2_delete_failed',
              count: keys.length,
              error: err instanceof Error ? err.message : String(err),
            }),
          );
        }
      }

      totalScanned += results.length;
      if (results.length < batchSize) break;
      offset += results.length;
    }

    await env.DB.prepare('DELETE FROM requests WHERE ts < ?').bind(cutoff).run();
    console.log(
      JSON.stringify({
        msg: 'gc_complete',
        cutoff,
        r2_deleted: r2Deleted,
        d1_rows_scanned: totalScanned,
      }),
    );
  } catch (err) {
    console.error(
      JSON.stringify({
        msg: 'gc_error',
        cutoff,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
    throw err;
  }
}
