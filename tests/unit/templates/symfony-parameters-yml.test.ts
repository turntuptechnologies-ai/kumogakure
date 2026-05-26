import { describe, expect, it } from 'vitest';
import { symfonyParametersYml } from '../../../src/bait/templates/symfony-parameters-yml.js';

const ctx = (method: string) => ({
  request: new Request('http://example.test/app/config/parameters.yml', { method }),
  path: '/app/config/parameters.yml',
  category: 'config-leak' as const,
  subcategory: 'symfony-config',
});

describe('symfony-parameters-yml', () => {
  it('returns the Symfony parameters.yml shape', async () => {
    const response = symfonyParametersYml(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('yaml');
    const body = await response.text();
    expect(body).toMatch(/^parameters:/);
    expect(body).toContain('database_host:');
    expect(body).toContain('mailer_transport:');
    expect(body).toContain('secret:');
  });

  it('uses .invalid host and REDACTED placeholder for secrets', async () => {
    const response = symfonyParametersYml(ctx('GET'));
    const body = await response.text();
    expect(body).toContain('db.example.invalid');
    expect(body).toContain('REDACTED_FOR_HONEYPOT');
  });

  it('emits no canary / tracking headers', () => {
    const response = symfonyParametersYml(ctx('GET'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
