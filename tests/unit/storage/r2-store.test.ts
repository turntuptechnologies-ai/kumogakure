import { describe, expect, it, vi } from 'vitest';
import { storePayload } from '../../../src/storage/r2.js';
import type { Env } from '../../../src/types.js';

function buildEnv() {
  const put = vi.fn().mockResolvedValue(undefined);
  const env = {
    DB: {} as D1Database,
    PAYLOADS: { put } as unknown as R2Bucket,
    BODY_R2_THRESHOLD: '8192',
    BODY_READ_LIMIT: '65536',
    RETENTION_DAYS: '30',
  } satisfies Env;
  return { env, put };
}

async function gunzipToString(data: ArrayBuffer | Uint8Array): Promise<string> {
  const stream = new Response(data).body;
  if (!stream) throw new Error('no stream');
  const decompressed = stream.pipeThrough(new DecompressionStream('gzip'));
  return new Response(decompressed).text();
}

describe('storePayload', () => {
  it('puts a gzip-compressed JSON object at the given key', async () => {
    const { env, put } = buildEnv();
    const headers = { 'user-agent': 'curl/8.1.0', 'x-forwarded-for': '203.0.113.1' };
    const body = '{"username":"admin"}';
    await storePayload(env, 'requests/2026/05/13/test.json.gz', { headers, body });

    expect(put).toHaveBeenCalledTimes(1);
    const [key, data, options] = put.mock.calls[0] ?? [];
    expect(key).toBe('requests/2026/05/13/test.json.gz');
    expect(options?.httpMetadata?.contentEncoding).toBe('gzip');

    const decompressed = await gunzipToString(data as ArrayBuffer);
    const parsed = JSON.parse(decompressed) as { headers: Record<string, string>; body: string };
    expect(parsed.headers).toEqual(headers);
    expect(parsed.body).toBe(body);
  });
});
