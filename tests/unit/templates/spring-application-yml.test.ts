import { describe, expect, it } from 'vitest';
import { springApplicationYml } from '../../../src/bait/templates/spring-application-yml.js';

const ctx = (method: string) => ({
  request: new Request('http://example.test/application.yml', { method }),
  path: '/application.yml',
  category: 'config-leak' as const,
  subcategory: 'spring-config',
});

describe('spring-application-yml', () => {
  it('returns a Spring Boot application.yml shape', async () => {
    const response = springApplicationYml(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('yaml');
    const body = await response.text();
    expect(body).toContain('spring:');
    expect(body).toContain('datasource:');
    expect(body).toMatch(/url:\s*jdbc:mysql:\/\//);
    expect(body).toContain('jwt:');
  });

  it('uses .invalid host and REDACTED placeholder for secrets', async () => {
    const response = springApplicationYml(ctx('GET'));
    const body = await response.text();
    expect(body).toContain('db.example.invalid');
    expect(body).toContain('REDACTED_FOR_HONEYPOT');
  });

  it('emits no canary / tracking headers', () => {
    const response = springApplicationYml(ctx('GET'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
