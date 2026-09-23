import { describe, expect, it } from 'vitest';
import { springApplicationProperties } from '../../../src/bait/templates/spring-application-properties.js';

const ctx = (path: string) => ({
  request: new Request(`http://example.test${path}`),
  path,
  category: 'config-leak' as const,
  subcategory: 'spring-config',
});

describe('spring-application-properties', () => {
  it('returns well-formed key=value properties with the Spring datasource keys', async () => {
    const response = springApplicationProperties(ctx('/application.properties'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    const text = await response.text();
    for (const line of text.split('\n').filter((l) => l.trim() !== '')) {
      expect(line).toMatch(/^[a-z][\w.-]*=\S/);
    }
    expect(text).toContain('spring.datasource.url=jdbc:mysql://db.example.invalid');
    expect(text).toContain('spring.datasource.password=REDACTED_FOR_HONEYPOT');
  });

  it('carries only placeholder secrets', async () => {
    const text = await springApplicationProperties(ctx('/application.properties')).text();
    for (const [, value] of text.matchAll(/(?:password|secret)=(.+)$/gm)) {
      expect(value).toBe('REDACTED_FOR_HONEYPOT');
    }
  });

  it('emits no canary / tracking headers', () => {
    const response = springApplicationProperties(ctx('/application.properties'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
