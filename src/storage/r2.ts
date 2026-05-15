import type { Env } from '../types.js';

export interface PayloadData {
  headers: Record<string, string>;
  body: string;
}

export function buildR2Key(id: string, ts: number): string {
  const date = new Date(ts * 1000);
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `requests/${yyyy}/${mm}/${dd}/${id}.json.gz`;
}

export async function storePayload(env: Env, key: string, data: PayloadData): Promise<void> {
  const json = JSON.stringify(data);
  const source = new Response(json).body;
  if (!source) {
    throw new Error('Failed to create source stream for payload');
  }
  const compressed = source.pipeThrough(new CompressionStream('gzip'));
  // R2.put requires a body of known length; a raw CompressionStream readable
  // has none and put() rejects it. The payload is already bounded by
  // BODY_READ_LIMIT, so buffering the compressed bytes here is safe.
  const buffer = await new Response(compressed).arrayBuffer();
  await env.PAYLOADS.put(key, buffer, {
    httpMetadata: { contentType: 'application/json', contentEncoding: 'gzip' },
  });
}
