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
  const encoded = new TextEncoder().encode(json);
  const compressed = await compressGzip(encoded);
  await env.PAYLOADS.put(key, compressed, {
    httpMetadata: { contentType: 'application/json', contentEncoding: 'gzip' },
  });
}

async function compressGzip(data: Uint8Array): Promise<ArrayBuffer> {
  const stream = new Response(data).body;
  if (!stream) {
    throw new Error('Failed to create stream for compression');
  }
  const compressed = stream.pipeThrough(new CompressionStream('gzip'));
  return await new Response(compressed).arrayBuffer();
}
