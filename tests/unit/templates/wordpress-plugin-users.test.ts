import { describe, expect, it } from 'vitest';
import { wordpressPluginUsers } from '../../../src/bait/templates/wordpress-plugin-users.js';

const ctx = (path: string) => ({
  request: new Request(`http://example.test${path}`),
  path,
  category: 'cms-auth' as const,
  subcategory: 'wordpress-rest-users',
});

describe('wordpress-plugin-users', () => {
  it('returns a JSON members list with slug (username) but no secrets', async () => {
    const response = wordpressPluginUsers(ctx('/wp-json/buddypress/v1/members'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const list = JSON.parse(await response.text()) as Array<Record<string, unknown>>;
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
    for (const m of list) {
      expect(typeof m.slug).toBe('string');
      expect(m).not.toHaveProperty('password');
      expect(m).not.toHaveProperty('email');
      expect(m).not.toHaveProperty('user_pass');
    }
  });

  it('serves the same roster as the core users decoy (coherent across endpoints)', async () => {
    const list = JSON.parse(
      await wordpressPluginUsers(ctx('/wp-json/lp/v1/users')).text(),
    ) as Array<{
      slug: string;
    }>;
    expect(list.map((m) => m.slug)).toEqual(['editor', 'staff', 'marketing']);
  });

  it('emits no canary / tracking headers', () => {
    const response = wordpressPluginUsers(ctx('/wp-json/um/v1/users'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
