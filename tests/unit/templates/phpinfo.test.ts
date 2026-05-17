import { describe, expect, it } from 'vitest';
import { phpinfo } from '../../../src/bait/templates/phpinfo.js';

const ctx = {
  request: new Request('http://example.test/phpinfo.php', { method: 'GET' }),
  path: '/phpinfo.php',
  category: 'config-leak' as const,
  subcategory: 'phpinfo',
};

describe('phpinfo template', () => {
  it('serves a 200 HTML phpinfo-looking page', async () => {
    const res = phpinfo(ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    const html = await res.text();
    expect(html).toContain('<title>phpinfo()</title>');
    expect(html).toContain('PHP Version 7.4.33');
    expect(html).toContain('disable_functions');
  });

  it('uses only policy-compliant fabricated data', async () => {
    const html = await phpinfo(ctx).text();
    expect(html).toContain('app.example.invalid');
    expect(html).toContain('REDACTED_FOR_HONEYPOT');
    expect(html).toContain('EXAMPLE_AKIA');
  });

  it('does not reproduce the PHP logo or php.net attribution', async () => {
    const html = await phpinfo(ctx).text();
    expect(html).not.toContain('<img');
    expect(html).not.toContain('php.net');
  });

  it('emits no honeypot canary header', () => {
    const res = phpinfo(ctx);
    for (const [k] of res.headers.entries()) {
      expect(k.toLowerCase()).not.toContain('honeypot');
    }
  });
});
