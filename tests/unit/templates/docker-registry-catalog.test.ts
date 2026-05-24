import { describe, expect, it } from 'vitest';
import { dockerRegistryCatalog } from '../../../src/bait/templates/docker-registry-catalog.js';

const ctx = (method: string) => ({
  request: new Request('http://example.test/v2/_catalog', { method }),
  path: '/v2/_catalog',
  category: 'api-recon' as const,
  subcategory: 'docker-registry',
});

describe('docker-registry-catalog', () => {
  it('returns the documented Docker Registry catalog JSON shape', async () => {
    const response = dockerRegistryCatalog(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('docker-distribution-api-version')).toBe('registry/2.0');
    const body = await response.text();
    const parsed = JSON.parse(body);
    expect(Array.isArray(parsed.repositories)).toBe(true);
    expect(parsed.repositories.length).toBeGreaterThan(0);
  });

  it('emits no canary / tracking headers', () => {
    const response = dockerRegistryCatalog(ctx('GET'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
