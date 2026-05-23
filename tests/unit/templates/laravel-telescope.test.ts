import { describe, expect, it } from 'vitest';
import { laravelTelescope } from '../../../src/bait/templates/laravel-telescope.js';

const ctx = (method: string) => ({
  request: new Request('http://example.test/telescope/requests', { method }),
  path: '/telescope/requests',
  category: 'cve-recon' as const,
  subcategory: 'laravel-telescope',
});

describe('laravel-telescope', () => {
  it('returns the Telescope SPA shell HTML', async () => {
    const response = laravelTelescope(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    const body = await response.text();
    expect(body).toContain('id="telescope"');
    expect(body).toContain('/vendor/telescope/app.js');
    expect(body).toContain('window.Telescope');
  });

  it('uses a placeholder csrf-token', async () => {
    const response = laravelTelescope(ctx('GET'));
    const body = await response.text();
    expect(body).toContain('REDACTED_FOR_HONEYPOT');
  });

  it('emits no canary / tracking headers', () => {
    const response = laravelTelescope(ctx('GET'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
