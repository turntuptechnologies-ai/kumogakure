import { describe, expect, it } from 'vitest';
import { boaFormLogin } from '../../../src/bait/templates/boa-form-login.js';

const ctx = {
  request: new Request('http://example.test/boaform/admin/formLogin'),
  path: '/boaform/admin/formLogin',
  category: 'iot-recon' as const,
  subcategory: 'generic-router',
};

describe('boa-form-login', () => {
  it('returns a minimal HTML login form', async () => {
    const response = boaFormLogin(ctx);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    const body = await response.text();
    expect(body).toContain('<form action="/boaform/admin/formLogin"');
    expect(body).toContain('name="username"');
    expect(body).toContain('name="psd"');
  });
});
