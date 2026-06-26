import { describe, expect, it } from 'vitest';
import { wordpressAdminAjax } from '../../../src/bait/templates/wordpress-admin-ajax.js';

const ctx = (method = 'GET') => ({
  request: new Request('http://example.test/wp-admin/admin-ajax.php', { method }),
  path: '/wp-admin/admin-ajax.php',
  category: 'cms-auth' as const,
  subcategory: 'wordpress',
});

describe('wordpress-admin-ajax', () => {
  it('returns the authentic no-action body `0` with HTTP 400', async () => {
    const response = wordpressAdminAjax(ctx());
    expect(response.status).toBe(400);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(await response.text()).toBe('0');
  });

  it('emits no canary / tracking headers', () => {
    const response = wordpressAdminAjax(ctx());
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
