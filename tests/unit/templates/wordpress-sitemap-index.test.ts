import { describe, expect, it } from 'vitest';
import { wordpressSitemapIndex } from '../../../src/bait/templates/wordpress-sitemap-index.js';

const ctx = () => ({
  request: new Request('http://example.test/wp-sitemap.xml'),
  path: '/wp-sitemap.xml',
  category: 'cms-auth' as const,
  subcategory: 'wordpress-fingerprint',
});

describe('wordpress-sitemap-index', () => {
  it('returns a sitemap index referencing the user sub-sitemap (chain coherence)', async () => {
    const response = wordpressSitemapIndex(ctx());
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('xml');
    const xml = await response.text();
    expect(xml).toContain('<sitemapindex');
    // The index must point at the sitemap our user-sitemap decoy serves.
    expect(xml).toContain('wp-sitemap-users-1.xml');
  });

  it('emits no canary / tracking headers', () => {
    const response = wordpressSitemapIndex(ctx());
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
