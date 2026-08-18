import { describe, expect, it } from 'vitest';
import { flaskConfig } from '../../../src/bait/templates/flask-config.js';

const ctx = (path: string) => ({
  request: new Request(`http://example.test${path}`, { method: 'GET' }),
  path,
  category: 'config-leak' as const,
  subcategory: 'flask-config',
});

describe('flask-config', () => {
  it('returns a Flask Config class with SECRET_KEY and DB credentials', async () => {
    const response = flaskConfig(ctx('/config.py'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/x-python');
    const body = await response.text();
    expect(body).toContain('class Config:');
    expect(body).toContain("SECRET_KEY = 'REDACTED_FOR_HONEYPOT'");
    expect(body).toContain('SQLALCHEMY_DATABASE_URI');
    expect(body).not.toContain('AKIA');
  });

  it('serves the same decoy for instance/config.py', async () => {
    const response = flaskConfig(ctx('/instance/config.py'));
    const body = await response.text();
    expect(body).toContain('class Config:');
  });

  it('emits no canary / tracking headers', () => {
    const response = flaskConfig(ctx('/config.py'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
