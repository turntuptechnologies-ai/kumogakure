import { describe, expect, it } from 'vitest';
import { aspnetTrace } from '../../../src/bait/templates/aspnet-trace.js';

const ctx = (method: string) => ({
  request: new Request('http://example.test/trace.axd', { method }),
  path: '/trace.axd',
  category: 'cve-recon' as const,
  subcategory: 'aspnet-trace',
});

describe('aspnet-trace', () => {
  it('returns an HTML page that resembles ASP.NET trace.axd', async () => {
    const response = aspnetTrace(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    const body = await response.text();
    expect(body).toContain('Application Trace');
    expect(body).toContain('Requests to this Application');
    expect(body).toContain('No requests are currently captured.');
  });

  it('emits no canary / tracking headers', () => {
    const response = aspnetTrace(ctx('GET'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
