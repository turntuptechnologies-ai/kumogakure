import { describe, expect, it } from 'vitest';
import { fakeWranglerConfig } from '../../../src/bait/templates/fake-wrangler-config.js';

function ctx(path: string) {
  return {
    request: new Request(`http://example.test${path}`),
    path,
    category: 'config-leak' as const,
    subcategory: 'cloudflare-workers',
  };
}

describe('fake-wrangler-config', () => {
  it('serves wrangler.toml as TOML with account id, bindings and vars', async () => {
    const response = fakeWranglerConfig(ctx('/wrangler.toml'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    const text = await response.text();
    expect(text).toMatch(/^account_id = "[0-9a-f]{32}"$/m);
    expect(text).toContain('[[kv_namespaces]]');
    expect(text).toContain('[vars]');
  });

  it('serves wrangler.json as JSON with the same values', async () => {
    const response = fakeWranglerConfig(ctx('/wrangler.json'));
    expect(response.headers.get('content-type')).toContain('application/json');
    const json = (await response.json()) as {
      account_id: string;
      vars: Record<string, string>;
      routes: { pattern: string }[];
    };
    expect(json.account_id).toMatch(/^[0-9a-f]{32}$/);
    expect(json.vars.UPSTREAM_API_TOKEN).toBe('REDACTED_FOR_HONEYPOT');
  });

  it('uses only .invalid hosts', async () => {
    const text = await fakeWranglerConfig(ctx('/wrangler.toml')).text();
    for (const host of text.match(/[a-z0-9.-]+\.(?:com|net|org|io|dev|invalid)\b/g) ?? []) {
      expect(host.endsWith('.invalid'), host).toBe(true);
    }
  });
});
