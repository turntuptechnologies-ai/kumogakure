import { describe, expect, it } from 'vitest';
import { aspnetWebConfig } from '../../../src/bait/templates/aspnet-web-config.js';

const ctx = (method: string) => ({
  request: new Request('http://example.test/web.config', { method }),
  path: '/web.config',
  category: 'config-leak' as const,
  subcategory: 'aspnet-config',
});

describe('aspnet-web-config', () => {
  it('returns an XML web.config with connectionStrings + appSettings', async () => {
    const response = aspnetWebConfig(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/xml');
    const body = await response.text();
    expect(body).toContain('<?xml version="1.0"');
    expect(body).toContain('<configuration>');
    expect(body).toContain('<connectionStrings>');
    expect(body).toContain('<appSettings>');
  });

  it('uses .invalid host and REDACTED placeholder for secrets', async () => {
    const response = aspnetWebConfig(ctx('GET'));
    const body = await response.text();
    expect(body).toContain('db.example.invalid');
    expect(body).toContain('REDACTED_FOR_HONEYPOT');
  });

  it('emits no canary / tracking headers', () => {
    const response = aspnetWebConfig(ctx('GET'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
