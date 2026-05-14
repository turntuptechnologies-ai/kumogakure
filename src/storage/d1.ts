import type { Env, RequestRecord } from '../types.js';

export async function insertRequest(env: Env, record: RequestRecord): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO requests (
      id, ts, ip, asn, asn_org, country, method, path, query, ua,
      category, subcategory, status, body_size, body_truncated, r2_key, signals,
      tls_version, tls_cipher
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      record.id,
      record.ts,
      record.ip ?? null,
      record.asn ?? null,
      record.asn_org ?? null,
      record.country ?? null,
      record.method,
      record.path,
      record.query ?? null,
      record.ua ?? null,
      record.category ?? null,
      record.subcategory ?? null,
      record.status,
      record.body_size ?? null,
      record.body_truncated ? 1 : null,
      record.r2_key ?? null,
      record.signals ? JSON.stringify(record.signals) : null,
      record.tls_version ?? null,
      record.tls_cipher ?? null,
    )
    .run();
}
