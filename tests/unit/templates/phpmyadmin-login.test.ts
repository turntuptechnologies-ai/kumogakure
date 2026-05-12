import { describe, expect, it } from 'vitest';
import { phpmyadminLogin } from '../../../src/bait/templates/phpmyadmin-login.js';

const ctx = (method: string) => ({
  request: new Request('http://example.test/phpmyadmin/', { method }),
  path: '/phpmyadmin/',
  category: 'cms-auth' as const,
  subcategory: 'phpmyadmin',
});

describe('phpmyadmin-login', () => {
  it('returns 200 HTML for GET without an error block', async () => {
    const response = phpmyadminLogin(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    const html = await response.text();
    expect(html).toContain('<form');
    expect(html).toContain('name="pma_username"');
    expect(html).toContain('name="pma_password"');
    expect(html).not.toContain('class="error_block"');
  });

  it('returns 200 HTML with error block for POST', async () => {
    const response = phpmyadminLogin(ctx('POST'));
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('class="error_block"');
    expect(html).toContain('Access denied');
  });
});
