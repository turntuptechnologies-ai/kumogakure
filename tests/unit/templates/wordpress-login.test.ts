import { describe, expect, it } from 'vitest';
import { wordpressLogin } from '../../../src/bait/templates/wordpress-login.js';

const ctx = (method: string) => ({
  request: new Request('http://example.test/wp-login.php', { method }),
  path: '/wp-login.php',
  category: 'cms-auth' as const,
  subcategory: 'wordpress',
});

describe('wordpress-login', () => {
  it('returns 200 HTML for GET without an error notice', async () => {
    const response = wordpressLogin(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    const html = await response.text();
    expect(html).toContain('<form');
    expect(html).toContain('name="log"');
    expect(html).toContain('name="pwd"');
    expect(html).not.toContain('login_error');
  });

  it('returns 200 HTML with error notice for POST', async () => {
    const response = wordpressLogin(ctx('POST'));
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('login_error');
    expect(html).toContain('<form');
  });
});
