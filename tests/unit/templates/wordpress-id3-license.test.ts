import { describe, expect, it } from 'vitest';
import { wordpressId3License } from '../../../src/bait/templates/wordpress-id3-license.js';

const ctx = (method: string) => ({
  request: new Request('http://example.test/wp-includes/ID3/license.txt', { method }),
  path: '/wp-includes/ID3/license.txt',
  category: 'cms-auth' as const,
  subcategory: 'wordpress-fingerprint',
});

describe('wordpress-id3-license', () => {
  it('returns a plain-text license that mentions getID3 (the scanner fingerprint string)', async () => {
    const response = wordpressId3License(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    const body = await response.text();
    expect(body).toContain('getID3');
    expect(body).toContain('GPL');
    expect(body).toContain('LGPL');
    expect(body).toContain('MPL');
  });

  it('does not impersonate a specific maintainer email', async () => {
    const response = wordpressId3License(ctx('GET'));
    const body = await response.text();
    // Defensive: no '@' followed by a real-looking domain. Only
    // structured license-text references — none of which contain
    // a personal email pattern.
    expect(body).not.toMatch(/[\w.+-]+@(?!example\.invalid)[\w-]+\.[a-z]+/i);
  });

  it('emits no canary / tracking headers', () => {
    const response = wordpressId3License(ctx('GET'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
