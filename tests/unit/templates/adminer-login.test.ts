import { describe, expect, it } from 'vitest';
import { adminerLogin } from '../../../src/bait/templates/adminer-login.js';

const ctx = (method = 'GET') => ({
  request: new Request('http://example.test/adminer.php', { method }),
  path: '/adminer.php',
  category: 'cms-auth' as const,
  subcategory: 'adminer',
});

describe('adminer-login', () => {
  it('serves a fingerprint-faithful Adminer login form on GET', async () => {
    const response = adminerLogin(ctx());
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    const html = await response.text();
    expect(html).toContain('Login - Adminer');
    // The auth[...] field names are how scanners fingerprint Adminer.
    for (const field of [
      'auth[driver]',
      'auth[server]',
      'auth[username]',
      'auth[password]',
      'auth[db]',
    ]) {
      expect(html, field).toContain(field);
    }
  });

  it('renders the invalid-credentials state on POST', async () => {
    const html = await adminerLogin(ctx('POST')).text();
    expect(html).toContain('Invalid credentials.');
  });

  it('does not show the error block on GET', async () => {
    const html = await adminerLogin(ctx('GET')).text();
    expect(html).not.toContain('Invalid credentials.');
  });

  it('emits no canary / tracking headers', () => {
    const response = adminerLogin(ctx());
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
