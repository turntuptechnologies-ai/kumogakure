import { describe, expect, it } from 'vitest';
import { fakeJsConfig } from '../../../src/bait/templates/fake-js-config.js';

const ctx = (path: string) => ({
  request: new Request(`http://example.test${path}`),
  path,
  category: 'config-leak' as const,
  subcategory: 'js-config',
});

describe('fake-js-config', () => {
  it('serves a JavaScript runtime-config object with decoy values', async () => {
    const response = fakeJsConfig(ctx('/config.js'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('javascript');
    const js = await response.text();
    expect(js).toContain('__APP_CONFIG__');
    expect(js).toContain('apiBaseUrl');
  });

  it('uses only non-actionable decoy hosts/placeholders (.invalid, EXAMPLE_/REDACTED)', async () => {
    const js = await fakeJsConfig(ctx('/env.js')).text();
    expect(js).toContain('.invalid');
    expect(js).toMatch(/EXAMPLE_|REDACTED_FOR_HONEYPOT/);
  });

  it('emits no canary / tracking headers', () => {
    const response = fakeJsConfig(ctx('/config.js'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
