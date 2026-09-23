import { describe, expect, it } from 'vitest';
import { railsDatabaseYml } from '../../../src/bait/templates/rails-database-yml.js';

const ctx = (path: string) => ({
  request: new Request(`http://example.test${path}`),
  path,
  category: 'config-leak' as const,
  subcategory: 'rails-database',
});

describe('rails-database-yml', () => {
  it('returns a Rails database.yml with per-environment sections', async () => {
    const response = railsDatabaseYml(ctx('/config/database.yml'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('yaml');
    const text = await response.text();
    for (const section of ['default: &default', 'development:', 'test:', 'production:']) {
      expect(text).toMatch(new RegExp(`^${section}$`, 'm'));
    }
    expect(text).toContain('<<: *default');
  });

  it('carries only placeholder secrets and .invalid hosts', async () => {
    const text = await railsDatabaseYml(ctx('/config/database.yml')).text();
    expect(text).toContain('password: REDACTED_FOR_HONEYPOT');
    expect(text).toContain('host: db.example.invalid');
  });

  it('emits no canary / tracking headers', () => {
    const response = railsDatabaseYml(ctx('/config/database.yml'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
