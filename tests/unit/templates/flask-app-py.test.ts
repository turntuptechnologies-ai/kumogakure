import { describe, expect, it } from 'vitest';
import { flaskAppPy } from '../../../src/bait/templates/flask-app-py.js';

const ctx = () => ({
  request: new Request('http://example.test/app.py', { method: 'GET' }),
  path: '/app.py',
  category: 'config-leak' as const,
  subcategory: 'flask-config',
});

describe('flask-app-py', () => {
  it('returns a Flask entrypoint with a hardcoded secret_key', async () => {
    const response = flaskAppPy(ctx());
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/x-python');
    const body = await response.text();
    expect(body).toContain('from flask import Flask');
    expect(body).toContain("app.secret_key = 'REDACTED_FOR_HONEYPOT'");
  });

  it('emits no canary / tracking headers', () => {
    const response = flaskAppPy(ctx());
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
