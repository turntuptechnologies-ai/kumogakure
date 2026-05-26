import { describe, expect, it } from 'vitest';
import { djangoSettings } from '../../../src/bait/templates/django-settings.js';

const ctx = (method: string) => ({
  request: new Request('http://example.test/settings.py', { method }),
  path: '/settings.py',
  category: 'config-leak' as const,
  subcategory: 'django-settings',
});

describe('django-settings', () => {
  it('returns a Django settings.py shape with SECRET_KEY + DATABASES + email', async () => {
    const response = djangoSettings(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/x-python');
    const body = await response.text();
    expect(body).toContain('SECRET_KEY');
    expect(body).toContain('DATABASES');
    expect(body).toContain('django.db.backends.postgresql');
    expect(body).toContain('EMAIL_HOST_PASSWORD');
    expect(body).toContain('DEBUG = False');
  });

  it('uses .invalid host and REDACTED placeholder for secrets', async () => {
    const response = djangoSettings(ctx('GET'));
    const body = await response.text();
    expect(body).toContain('db.example.invalid');
    expect(body).toContain('REDACTED_FOR_HONEYPOT');
  });

  it('emits no canary / tracking headers', () => {
    const response = djangoSettings(ctx('GET'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
