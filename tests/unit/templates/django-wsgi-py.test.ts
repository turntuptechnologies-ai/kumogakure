import { describe, expect, it } from 'vitest';
import { djangoWsgiPy } from '../../../src/bait/templates/django-wsgi-py.js';

const ctx = () => ({
  request: new Request('http://example.test/wsgi.py', { method: 'GET' }),
  path: '/wsgi.py',
  category: 'config-leak' as const,
  subcategory: 'django-entrypoint',
});

describe('django-wsgi-py', () => {
  it('returns the Django wsgi.py module as Python source', async () => {
    const response = djangoWsgiPy(ctx());
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/x-python');
    const body = await response.text();
    expect(body).toContain('from django.core.wsgi import get_wsgi_application');
    expect(body).toContain('application = get_wsgi_application()');
  });

  it('emits no canary / tracking headers', () => {
    const response = djangoWsgiPy(ctx());
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
