import { describe, expect, it } from 'vitest';
import { buildR2Key } from '../../../src/storage/r2.js';

describe('buildR2Key', () => {
  it('encodes the UTC date of the timestamp into the key path', () => {
    // 2026-05-13T12:34:56Z
    const ts = Math.floor(Date.UTC(2026, 4, 13, 12, 34, 56) / 1000);
    const key = buildR2Key('11111111-2222-7333-8444-555555555555', ts);
    expect(key).toBe('requests/2026/05/13/11111111-2222-7333-8444-555555555555.json.gz');
  });

  it('zero-pads months and days', () => {
    const ts = Math.floor(Date.UTC(2026, 0, 1) / 1000);
    const key = buildR2Key('abc', ts);
    expect(key).toContain('/2026/01/01/');
  });
});
