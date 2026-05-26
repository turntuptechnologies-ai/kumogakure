import { describe, expect, it } from 'vitest';
import { dotnetAppsettings } from '../../../src/bait/templates/dotnet-appsettings.js';

const ctx = (method: string) => ({
  request: new Request('http://example.test/appsettings.json', { method }),
  path: '/appsettings.json',
  category: 'config-leak' as const,
  subcategory: 'aspnet-config',
});

describe('dotnet-appsettings', () => {
  it('returns an ASP.NET Core appsettings.json with ConnectionStrings + Jwt', async () => {
    const response = dotnetAppsettings(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const body = await response.text();
    const parsed = JSON.parse(body);
    expect(parsed.ConnectionStrings).toBeDefined();
    expect(parsed.ConnectionStrings.DefaultConnection).toContain('Server=');
    expect(parsed.Jwt).toBeDefined();
    expect(parsed.Logging).toBeDefined();
  });

  it('uses .invalid host and REDACTED placeholder for secrets', async () => {
    const response = dotnetAppsettings(ctx('GET'));
    const body = await response.text();
    const parsed = JSON.parse(body);
    expect(parsed.ConnectionStrings.DefaultConnection).toContain('db.example.invalid');
    expect(parsed.ConnectionStrings.DefaultConnection).toContain('REDACTED_FOR_HONEYPOT');
    expect(parsed.Jwt.Key).toBe('REDACTED_FOR_HONEYPOT');
  });

  it('emits no canary / tracking headers', () => {
    const response = dotnetAppsettings(ctx('GET'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
