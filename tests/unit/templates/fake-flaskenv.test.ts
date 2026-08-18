import { describe, expect, it } from 'vitest';
import { fakeFlaskenv } from '../../../src/bait/templates/fake-flaskenv.js';

const ctx = () => ({
  request: new Request('http://example.test/.flaskenv', { method: 'GET' }),
  path: '/.flaskenv',
  category: 'config-leak' as const,
  subcategory: 'flask-config',
});

describe('fake-flaskenv', () => {
  it('returns a Flask-flavoured dotenv body', async () => {
    const response = fakeFlaskenv(ctx());
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    const body = await response.text();
    expect(body).toContain('FLASK_APP=');
    expect(body).toContain('SECRET_KEY=REDACTED_FOR_HONEYPOT');
    expect(body).not.toContain('APP_KEY=');
  });

  it('emits no canary / tracking headers', () => {
    const response = fakeFlaskenv(ctx());
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
