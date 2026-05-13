import { describe, expect, it } from 'vitest';
import { citrixVpn } from '../../../src/bait/templates/citrix-vpn.js';

const ctx = (method: string) => ({
  request: new Request('http://example.test/vpn/index.html', { method }),
  path: '/vpn/index.html',
  category: 'cve-recon' as const,
  subcategory: 'citrix',
});

describe('citrix-vpn', () => {
  it('renders the login form on GET with no error block', async () => {
    const response = citrixVpn(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    const html = await response.text();
    expect(html).toContain('<form action="/cgi/login"');
    expect(html).toContain('name="login"');
    expect(html).toContain('name="passwd"');
    expect(html).not.toContain('Incorrect user name or password');
  });

  it('renders the error block on POST', async () => {
    const response = citrixVpn(ctx('POST'));
    const html = await response.text();
    expect(html).toContain('Incorrect user name or password');
  });
});
