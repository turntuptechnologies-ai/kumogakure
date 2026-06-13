import { describe, expect, it } from 'vitest';
import { memberpressMembers } from '../../../src/bait/templates/memberpress-members.js';

const ctx = (path: string) => ({
  request: new Request(`http://example.test${path}`),
  path,
  category: 'cms-auth' as const,
  subcategory: 'memberpress',
});

describe('memberpress-members', () => {
  it('returns the authentic 401 rest_forbidden body (no member leaked)', async () => {
    const response = memberpressMembers(ctx('/wp-json/mepr/v1/members'));
    expect(response.status).toBe(401);
    expect(response.headers.get('content-type')).toContain('application/json');
    const json = (await response.json()) as { code: string; data: { status: number } };
    expect(json.code).toBe('rest_forbidden');
    expect(json.data.status).toBe(401);
  });

  it('leaks no member/email fields', async () => {
    const text = await memberpressMembers(ctx('/wp-json/mepr/v1/members')).text();
    expect(text).not.toMatch(/email|first_name|membership/i);
  });

  it('emits no canary / tracking headers', () => {
    const response = memberpressMembers(ctx('/wp-json/mepr/v1/members'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
