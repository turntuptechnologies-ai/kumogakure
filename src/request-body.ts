import { parsePositiveInt } from './env.js';

export interface BodyReadResult {
  body: string;
  size: number;
  truncated: boolean;
}

export const DEFAULT_BODY_READ_LIMIT = 65536;

export async function readRequestBody(request: Request, limit: number): Promise<BodyReadResult> {
  const method = request.method;
  if (method === 'GET' || method === 'HEAD') {
    return { body: '', size: 0, truncated: false };
  }

  const stream = request.body;
  if (!stream) {
    return { body: '', size: 0, truncated: false };
  }

  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  let truncated = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    const remaining = limit - size;
    if (value.byteLength <= remaining) {
      chunks.push(value);
      size += value.byteLength;
      continue;
    }

    if (remaining > 0) {
      chunks.push(value.subarray(0, remaining));
      size = limit;
    }
    truncated = true;
    await reader.cancel();
    break;
  }

  const combined = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { body: new TextDecoder().decode(combined), size, truncated };
}

export function resolveBodyReadLimit(raw: string | undefined): number {
  return parsePositiveInt(raw) ?? DEFAULT_BODY_READ_LIMIT;
}
