import { describe, expect, it } from 'vitest';
import { wordpressUsersMe } from '../../../src/bait/templates/wordpress-users-me.js';

const ctx = (path: string) => ({
  request: new Request(`http://example.test${path}`),
  path,
  category: 'cms-auth' as const,
  subcategory: 'wordpress-rest-users',
});

describe('wordpress-users-me', () => {
  it('returns the authentic 401 rest_not_logged_in body (no user leaked)', async () => {
    const response = wordpressUsersMe(ctx('/wp-json/wp/v2/users/me'));
    expect(response.status).toBe(401);
    expect(response.headers.get('content-type')).toContain('application/json');
    const json = (await response.json()) as { code: string; data: { status: number } };
    expect(json.code).toBe('rest_not_logged_in');
    expect(json.data.status).toBe(401);
  });

  it('emits no canary / tracking headers', () => {
    const response = wordpressUsersMe(ctx('/wp-json/wp/v2/users/me'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
