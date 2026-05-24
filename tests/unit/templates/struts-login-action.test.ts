import { describe, expect, it } from 'vitest';
import { strutsLoginAction } from '../../../src/bait/templates/struts-login-action.js';

const ctx = (method: string) => ({
  request: new Request('http://example.test/login.action', { method }),
  path: '/login.action',
  category: 'cve-recon' as const,
  subcategory: 'struts',
});

describe('struts-login-action', () => {
  it('returns a Struts-flavoured login form that posts to login.action', async () => {
    const response = strutsLoginAction(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    const body = await response.text();
    expect(body).toContain('action="login.action"');
    expect(body).toContain('name="struts.token"');
    expect(body).toContain('name="username"');
    expect(body).toContain('name="password"');
  });

  it('uses a placeholder for the Struts token', async () => {
    const response = strutsLoginAction(ctx('GET'));
    const body = await response.text();
    expect(body).toContain('REDACTED_FOR_HONEYPOT');
  });

  it('emits no canary / tracking headers', () => {
    const response = strutsLoginAction(ctx('GET'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
