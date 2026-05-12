import type { Env } from '../types.js';

export async function runDailyGc(env: Env): Promise<void> {
  const retentionDays = Number.parseInt(env.RETENTION_DAYS, 10);
  if (!Number.isFinite(retentionDays) || retentionDays <= 0) {
    return;
  }
  const cutoff = Math.floor(Date.now() / 1000) - retentionDays * 86400;

  const expiredKeys = await env.DB.prepare(
    'SELECT r2_key FROM requests WHERE ts < ? AND r2_key IS NOT NULL',
  )
    .bind(cutoff)
    .all<{ r2_key: string }>();

  for (const row of expiredKeys.results) {
    if (row.r2_key) {
      await env.PAYLOADS.delete(row.r2_key);
    }
  }

  await env.DB.prepare('DELETE FROM requests WHERE ts < ?').bind(cutoff).run();
}
