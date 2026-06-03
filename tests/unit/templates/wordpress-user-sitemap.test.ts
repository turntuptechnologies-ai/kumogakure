import { describe, expect, it } from 'vitest';
import { wordpressUserSitemap } from '../../../src/bait/templates/wordpress-user-sitemap.js';

const ctx = (path: string) => ({
  request: new Request(`http://example.test${path}`),
  path,
  category: 'cms-auth' as const,
  subcategory: 'wordpress-user-sitemap',
});

describe('wordpress-user-sitemap', () => {
  it('returns a sitemap urlset of author URLs leaking the slug set', async () => {
    const response = wordpressUserSitemap(ctx('/wp-sitemap-users-1.xml'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('xml');
    const xml = await response.text();
    expect(xml).toContain('<urlset');
    expect(xml).toContain('/author/editor/');
    expect(xml).toContain('/author/staff/');
    expect(xml).toContain('/author/marketing/');
  });

  it('is well-formed (balanced url tags)', async () => {
    const xml = await wordpressUserSitemap(ctx('/author-sitemap.xml')).text();
    const open = (xml.match(/<url>/g) ?? []).length;
    const close = (xml.match(/<\/url>/g) ?? []).length;
    expect(open).toBe(close);
    expect(open).toBeGreaterThan(0);
  });

  it('emits no canary / tracking headers', () => {
    const response = wordpressUserSitemap(ctx('/wp-sitemap-users-1.xml'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
