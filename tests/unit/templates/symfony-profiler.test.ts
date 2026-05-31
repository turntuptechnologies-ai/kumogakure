import { describe, expect, it } from 'vitest';
import { symfonyProfiler } from '../../../src/bait/templates/symfony-profiler.js';

const ctx = (path: string) => ({
  request: new Request(`http://example.test${path}`),
  path,
  category: 'cve-recon' as const,
  subcategory: 'symfony-profiler',
});

describe('symfony-profiler', () => {
  it('renders a Symfony-branded profiler page', async () => {
    const response = symfonyProfiler(ctx('/_profiler'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    const html = await response.text();
    expect(html).toContain('Symfony Profiler');
    expect(html).toContain('sf-profiler-header');
  });

  it('sets the X-Debug-Token header that real Symfony profiler responses carry', () => {
    const response = symfonyProfiler(ctx('/app_dev.php/_profiler/open'));
    expect(response.headers.get('x-debug-token')).toBeTruthy();
  });

  it('emits no canary / tracking headers', () => {
    const response = symfonyProfiler(ctx('/_profiler'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
