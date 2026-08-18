import { describe, expect, it } from 'vitest';
import { djangoManagePy } from '../../../src/bait/templates/django-manage-py.js';

const ctx = () => ({
  request: new Request('http://example.test/manage.py', { method: 'GET' }),
  path: '/manage.py',
  category: 'config-leak' as const,
  subcategory: 'django-entrypoint',
});

describe('django-manage-py', () => {
  it('returns the Django manage.py bootstrap script as Python source', async () => {
    const response = djangoManagePy(ctx());
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/x-python');
    const body = await response.text();
    expect(body).toContain("os.environ.setdefault('DJANGO_SETTINGS_MODULE'");
    expect(body).toContain('execute_from_command_line');
  });

  it('emits no canary / tracking headers', () => {
    const response = djangoManagePy(ctx());
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
