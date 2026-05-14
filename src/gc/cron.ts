import type { Env } from '../types.js';

export async function runDailyGc(env: Env): Promise<void> {
  const retentionDays = Number.parseInt(env.RETENTION_DAYS, 10);
  if (!Number.isFinite(retentionDays) || retentionDays <= 0) {
    console.log(JSON.stringify({ msg: 'gc_skipped', reason: 'invalid_retention' }));
    return;
  }
  const cutoff = Math.floor(Date.now() / 1000) - retentionDays * 86400;
  console.log(JSON.stringify({ msg: 'gc_start', cutoff, retention_days: retentionDays }));

  try {
    const expiredKeys = await env.DB.prepare(
      'SELECT r2_key FROM requests WHERE ts < ? AND r2_key IS NOT NULL',
    )
      .bind(cutoff)
      .all<{ r2_key: string }>();

    let r2Deleted = 0;
    for (const row of expiredKeys.results) {
      if (!row.r2_key) continue;
      try {
        await env.PAYLOADS.delete(row.r2_key);
        r2Deleted += 1;
      } catch (err) {
        console.error(
          JSON.stringify({
            msg: 'gc_r2_delete_failed',
            key: row.r2_key,
            error: err instanceof Error ? err.message : String(err),
          }),
        );
      }
    }

    await env.DB.prepare('DELETE FROM requests WHERE ts < ?').bind(cutoff).run();
    console.log(
      JSON.stringify({
        msg: 'gc_complete',
        cutoff,
        r2_deleted: r2Deleted,
        d1_rows_scanned: expiredKeys.results.length,
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
