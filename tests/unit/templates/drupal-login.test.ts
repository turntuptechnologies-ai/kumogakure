import { describe, expect, it } from 'vitest';
import { drupalLogin } from '../../../src/bait/templates/drupal-login.js';

const ctx = (method: string) => ({
  request: new Request('http://example.test/user/login', { method }),
  path: '/user/login',
  category: 'cms-auth' as const,
  subcategory: 'drupal',
});

describe('drupal-login', () => {
  it('returns 200 HTML for GET without an error message', async () => {
    const response = drupalLogin(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    const html = await response.text();
    expect(html).toContain('<form');
    expect(html).toContain('name="name"');
    expect(html).toContain('name="pass"');
    expect(html).toContain('form_id" value="user_login_form');
    expect(html).not.toContain('Unrecognized username or password');
  });

  it('returns 200 HTML with error message for POST', async () => {
    const response = drupalLogin(ctx('POST'));
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('class="messages messages--error"');
    expect(html).toContain('Unrecognized username or password');
  });
});
