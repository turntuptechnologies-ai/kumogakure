import { describe, expect, it } from 'vitest';
import { joomlaLogin } from '../../../src/bait/templates/joomla-login.js';

const ctx = (method: string) => ({
  request: new Request('http://example.test/administrator/index.php', { method }),
  path: '/administrator/index.php',
  category: 'cms-auth' as const,
  subcategory: 'joomla',
});

describe('joomla-login', () => {
  it('returns 200 HTML for GET without an alert', async () => {
    const response = joomlaLogin(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    const html = await response.text();
    expect(html).toContain('<form');
    expect(html).toContain('name="username"');
    expect(html).toContain('name="passwd"');
    expect(html).toContain('name="option" value="com_login"');
    expect(html).not.toContain('class="alert"');
  });

  it('returns 200 HTML with alert for POST', async () => {
    const response = joomlaLogin(ctx('POST'));
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('class="alert"');
  });
});
