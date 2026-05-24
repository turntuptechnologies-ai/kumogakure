import { describe, expect, it } from 'vitest';
import { cpanelLogin } from '../../../src/bait/templates/cpanel-login.js';

const ctx = (method: string) => ({
  request: new Request('http://example.test/___proxy_subdomain_cpanel', { method }),
  path: '/___proxy_subdomain_cpanel',
  category: 'cms-auth' as const,
  subcategory: 'cpanel',
});

describe('cpanel-login', () => {
  it('returns a cPanel-shaped login form that posts to /login', async () => {
    const response = cpanelLogin(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    const body = await response.text();
    expect(body).toContain('cPanel');
    expect(body).toContain('action="/login"');
    expect(body).toContain('name="user"');
    expect(body).toContain('name="pass"');
  });

  it('shows the login-error message on POST', async () => {
    const response = cpanelLogin(ctx('POST'));
    const body = await response.text();
    expect(body).toContain('The login is invalid.');
  });

  it('emits no canary / tracking headers', () => {
    const response = cpanelLogin(ctx('GET'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
