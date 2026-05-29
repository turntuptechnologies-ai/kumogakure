import { describe, expect, it } from 'vitest';
import { djangoDebugToolbar } from '../../../src/bait/templates/django-debug-toolbar.js';

const ctx = (method: string) => ({
  request: new Request('http://example.test/__debug__/render_panel/', { method }),
  path: '/__debug__/render_panel/',
  category: 'cve-recon' as const,
  subcategory: 'django-debug-toolbar',
});

describe('django-debug-toolbar', () => {
  it("returns DjDT's canonical render_panel 'data not available' message", async () => {
    const response = djangoDebugToolbar(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    const body = await response.text();
    expect(body).toContain("Data for this panel isn't available anymore");
  });

  it('leaks no actual debug data (no SQL / settings / request dump)', async () => {
    const response = djangoDebugToolbar(ctx('GET'));
    const body = await response.text();
    expect(body).not.toMatch(/SELECT |SECRET_KEY|DATABASES|INSTALLED_APPS/);
  });

  it('emits no canary / tracking headers', () => {
    const response = djangoDebugToolbar(ctx('GET'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
