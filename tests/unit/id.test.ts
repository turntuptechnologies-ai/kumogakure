import { describe, expect, it } from 'vitest';
import { uuidv7 } from '../../src/id.js';

const uuidv7Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('uuidv7', () => {
  it('produces a canonical UUIDv7 string', () => {
    const id = uuidv7();
    expect(id).toMatch(uuidv7Regex);
  });

  it('encodes the current unix-millisecond timestamp in the first 48 bits', () => {
    const before = Date.now();
    const id = uuidv7();
    const after = Date.now();
    const tsHex = id.slice(0, 8) + id.slice(9, 13);
    const ts = Number.parseInt(tsHex, 16);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it('produces lexicographically increasing IDs across millisecond boundaries', async () => {
    const a = uuidv7();
    await new Promise((resolve) => setTimeout(resolve, 5));
    const b = uuidv7();
    expect(a < b).toBe(true);
  });

  it('produces unique IDs across many calls', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      ids.add(uuidv7());
    }
    expect(ids.size).toBe(1000);
  });
});
