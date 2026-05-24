import { describe, expect, it } from 'vitest';
import { whmLogin } from '../../../src/bait/templates/whm-login.js';

const ctx = (method: string) => ({
  request: new Request('http://example.test/___proxy_subdomain_whm/login', { method }),
  path: '/___proxy_subdomain_whm/login',
  category: 'cms-auth' as const,
  subcategory: 'whm',
});

describe('whm-login', () => {
  it('returns a WHM-shaped login form that posts to /login', async () => {
    const response = whmLogin(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    const body = await response.text();
    expect(body).toContain('WHM');
    expect(body).toContain('Web Host Manager');
    expect(body).toContain('action="/login"');
    expect(body).toContain('name="user"');
    expect(body).toContain('name="pass"');
  });

  it('shows the login-error message on POST', async () => {
    const response = whmLogin(ctx('POST'));
    const body = await response.text();
    expect(body).toContain('The login is invalid.');
  });

  it('emits no canary / tracking headers', () => {
    const response = whmLogin(ctx('GET'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
