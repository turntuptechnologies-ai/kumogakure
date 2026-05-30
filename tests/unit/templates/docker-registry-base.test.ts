import { describe, expect, it } from 'vitest';
import { dockerRegistryBase } from '../../../src/bait/templates/docker-registry-base.js';

const ctx = (path: string) => ({
  request: new Request(`http://example.test${path}`),
  path,
  category: 'api-recon' as const,
  subcategory: 'docker-registry',
});

describe('docker-registry-base', () => {
  it('answers the V2 version-check probe with 200 {} and the registry header', async () => {
    const response = dockerRegistryBase(ctx('/v2/'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('docker-distribution-api-version')).toBe('registry/2.0');
    const parsed = JSON.parse(await response.text());
    expect(parsed).toEqual({});
  });

  it('emits no canary / tracking headers', () => {
    const response = dockerRegistryBase(ctx('/v2/'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
