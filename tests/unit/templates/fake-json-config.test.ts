import { describe, expect, it } from 'vitest';
import { fakeJsonConfig } from '../../../src/bait/templates/fake-json-config.js';

const ctx = (path: string) => ({
  request: new Request(`http://example.test${path}`),
  path,
  category: 'config-leak' as const,
  subcategory: 'js-config',
});

describe('fake-json-config', () => {
  it('returns a well-formed JSON runtime config with backend URLs', async () => {
    const response = fakeJsonConfig(ctx('/config.production.json'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const json = (await response.json()) as { apiBaseUrl: string; apiKey: string };
    expect(json.apiBaseUrl).toMatch(/^https?:\/\//);
    expect(json.apiKey).toBeTruthy();
  });

  it('does not ship the self-identifying canary tokens', async () => {
    const text = await fakeJsonConfig(ctx('/config.json')).text();
    expect(text).not.toMatch(/honeypot/i);
    expect(text).not.toMatch(/REDACTED_FOR_HONEYPOT/);
  });

  it('emits no canary / tracking headers', () => {
    const response = fakeJsonConfig(ctx('/config.json'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
