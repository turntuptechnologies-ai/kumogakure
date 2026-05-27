import { describe, expect, it } from 'vitest';
import { wordpressUsersApi } from '../../../src/bait/templates/wordpress-users-api.js';

const ctx = (method: string) => ({
  request: new Request('http://example.test/wp-json/wp/v2/users/', { method }),
  path: '/wp-json/wp/v2/users/',
  category: 'cms-auth' as const,
  subcategory: 'wordpress-rest-users',
});

describe('wordpress-users-api', () => {
  it('returns a WP REST users JSON array with the canonical fields', async () => {
    const response = wordpressUsersApi(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const body = await response.text();
    const parsed = JSON.parse(body);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
    for (const u of parsed) {
      expect(u.id).toBeDefined();
      expect(u.name).toBeDefined();
      expect(u.slug).toBeDefined();
      expect(u.avatar_urls).toBeDefined();
      // WP's public users API never includes email or capabilities;
      // we must not leak anything beyond that surface either.
      expect(u).not.toHaveProperty('email');
      expect(u).not.toHaveProperty('password');
      expect(u).not.toHaveProperty('capabilities');
    }
  });

  it('uses generic role-shaped slugs (not real-person names) on .invalid hosts', async () => {
    const response = wordpressUsersApi(ctx('GET'));
    const body = await response.text();
    const parsed = JSON.parse(body);
    const slugs = parsed.map((u: { slug: string }) => u.slug);
    expect(slugs).toContain('editor');
    expect(slugs).toContain('staff');
    expect(parsed.every((u: { url: string }) => u.url.endsWith('.invalid'))).toBe(true);
  });

  it('emits no canary / tracking headers', () => {
    const response = wordpressUsersApi(ctx('GET'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
