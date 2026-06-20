import { describe, expect, it } from 'vitest';
import { wordpressUserById } from '../../../src/bait/templates/wordpress-user-by-id.js';
import { publicUsers } from '../../../src/bait/templates/wordpress-users-api.js';

const ctx = (path: string) => ({
  request: new Request(`http://example.test${path}`),
  path,
  category: 'cms-auth' as const,
  subcategory: 'wordpress-rest-users',
});

describe('wordpress-user-by-id', () => {
  it('returns the same public record the collection advertises (no drift)', async () => {
    for (const u of publicUsers) {
      const response = wordpressUserById(ctx(`/wp-json/wp/v2/users/${u.id}`));
      expect(response.status, String(u.id)).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');
      const json = (await response.json()) as { id: number; slug: string };
      expect(json.id).toBe(u.id);
      expect(json.slug).toBe(u.slug);
    }
  });

  it('returns rest_user_invalid_id 404 for ids the install does not have', async () => {
    for (const id of [7, 8, 10, 9999]) {
      const response = wordpressUserById(ctx(`/wp-json/wp/v2/users/${id}`));
      expect(response.status, String(id)).toBe(404);
      const json = (await response.json()) as { code: string; data: { status: number } };
      expect(json.code).toBe('rest_user_invalid_id');
      expect(json.data.status).toBe(404);
    }
  });

  it('leaks no email/password field for a valid user', async () => {
    const text = await wordpressUserById(ctx('/wp-json/wp/v2/users/1')).text();
    expect(text).not.toMatch(/email|user_pass|password/i);
  });

  it('emits no canary / tracking headers', () => {
    const response = wordpressUserById(ctx('/wp-json/wp/v2/users/1'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
