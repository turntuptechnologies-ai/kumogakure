import { describe, expect, it } from 'vitest';
import { dockerComposeYml } from '../../../src/bait/templates/docker-compose-yml.js';

const ctx = (method: string) => ({
  request: new Request('http://example.test/docker-compose.yml', { method }),
  path: '/docker-compose.yml',
  category: 'config-leak' as const,
  subcategory: 'docker-compose',
});

describe('docker-compose-yml', () => {
  it('returns a multi-service docker-compose shape', async () => {
    const response = dockerComposeYml(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('yaml');
    const body = await response.text();
    expect(body).toMatch(/^version:/);
    expect(body).toContain('services:');
    expect(body).toContain('environment:');
    expect(body).toContain('POSTGRES_PASSWORD:');
    expect(body).toContain('REDIS_PASSWORD:');
  });

  it('uses REDACTED placeholder for every credential-like field', async () => {
    const response = dockerComposeYml(ctx('GET'));
    const body = await response.text();
    expect(body).toContain('REDACTED_FOR_HONEYPOT');
    // No accidentally-real passwords masquerading as fixtures.
    expect(body).not.toMatch(/password:\s*[a-zA-Z0-9]{12,}\b/i);
  });

  it('emits no canary / tracking headers', () => {
    const response = dockerComposeYml(ctx('GET'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
