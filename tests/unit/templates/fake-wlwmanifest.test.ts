import { describe, expect, it } from 'vitest';
import { fakeWlwmanifest } from '../../../src/bait/templates/fake-wlwmanifest.js';

const ctx = {
  request: new Request('http://example.test/wp-includes/wlwmanifest.xml', { method: 'GET' }),
  path: '/wp-includes/wlwmanifest.xml',
  category: 'cms-auth' as const,
  subcategory: 'wordpress-fingerprint',
};

describe('fake-wlwmanifest template', () => {
  it('serves a 200 XML manifest in the WordPress format', async () => {
    const res = fakeWlwmanifest(ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/xml');
    const body = await res.text();
    expect(body).toContain('<manifest xmlns="http://schemas.microsoft.com/wlw/manifest/weblog">');
    expect(body).toContain('<serviceName>WordPress</serviceName>');
    expect(body).toContain('<adminUrl>{blog-homepage-url}wp-admin/</adminUrl>');
  });

  it('emits no honeypot canary header', () => {
    for (const [k] of fakeWlwmanifest(ctx).headers.entries()) {
      expect(k.toLowerCase()).not.toContain('honeypot');
    }
  });
});
