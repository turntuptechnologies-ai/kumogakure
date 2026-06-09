import { describe, expect, it } from 'vitest';
import { findHeaderBait, headerBait } from '../../../src/bait/headers.js';

const req = (headers: Record<string, string>) =>
  new Request('http://example.test/', { method: 'POST', headers });

describe('header-signature bait', () => {
  it('routes a Next.js Server Action (Next-Action header) to the decoy', () => {
    const m = findHeaderBait(req({ 'next-action': '8eb0e5ed8819659b579d2bda3de1ddd5f0b59413' }));
    expect(m?.category).toBe('cve-recon');
    expect(m?.subcategory).toBe('nextjs-server-action');
    expect(m?.template).toBe('nextjs-server-action');
  });

  it('matches the header case-insensitively (Next-Action / NEXT-ACTION)', () => {
    expect(findHeaderBait(req({ 'Next-Action': 'abc' }))?.template).toBe('nextjs-server-action');
    expect(findHeaderBait(req({ 'NEXT-ACTION': 'abc' }))?.template).toBe('nextjs-server-action');
  });

  it('returns undefined when no header signature matches', () => {
    expect(findHeaderBait(req({ 'content-type': 'application/json' }))).toBeUndefined();
    expect(findHeaderBait(req({}))).toBeUndefined();
  });

  it('exposes a non-empty signature label for every entry', () => {
    for (const e of headerBait) {
      expect(e.signature.length).toBeGreaterThan(0);
    }
  });
});
