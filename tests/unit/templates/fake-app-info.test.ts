import { describe, expect, it } from 'vitest';
import { fakeAppInfo } from '../../../src/bait/templates/fake-app-info.js';

const ctx = (path: string) => ({
  request: new Request(`http://example.test${path}`, { method: 'GET' }),
  path,
  category: 'api-recon' as const,
  subcategory: 'server-info',
});

describe('fake-app-info', () => {
  it('returns a version-shaped body for /version', async () => {
    const response = fakeAppInfo(ctx('/version'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const body = await response.json();
    expect(body).toHaveProperty('version');
    expect(body).not.toHaveProperty('description');
    expect(body).not.toHaveProperty('server');
  });

  it('returns an about-shaped body for /about', async () => {
    const body = await fakeAppInfo(ctx('/about')).json();
    expect(body).toHaveProperty('name');
    expect(body).toHaveProperty('description');
    expect(body).toHaveProperty('version');
  });

  it('returns a server-shaped body for /server', async () => {
    const body = await fakeAppInfo(ctx('/server')).json();
    expect(body).toHaveProperty('server');
    expect(body).toHaveProperty('environment');
    expect(body).toHaveProperty('uptime');
  });

  it('falls back to the version body for any other path', async () => {
    const body = await fakeAppInfo(ctx('/anything-else')).json();
    expect(body).toHaveProperty('version');
  });

  it('emits no canary / tracking headers', () => {
    const response = fakeAppInfo(ctx('/version'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
