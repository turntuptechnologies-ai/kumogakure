import { describe, expect, it } from 'vitest';
import { exchangeOwaLogin } from '../../../src/bait/templates/exchange-owa-login.js';

const ctx = (method: string) => ({
  request: new Request('http://example.test/owa/auth/logon.aspx', { method }),
  path: '/owa/auth/logon.aspx',
  category: 'cve-recon' as const,
  subcategory: 'exchange',
});

describe('exchange-owa-login', () => {
  it('renders the OWA-style login form on GET', async () => {
    const response = exchangeOwaLogin(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    const html = await response.text();
    expect(html).toContain('<form action="/owa/auth.owa"');
    expect(html).toContain('name="username"');
    expect(html).toContain('name="password"');
    expect(html).toContain('name="destination"');
    expect(html).not.toContain("isn't correct");
  });

  it('includes the error text on POST', async () => {
    const response = exchangeOwaLogin(ctx('POST'));
    const html = await response.text();
    expect(html).toContain("isn't correct");
  });
});
