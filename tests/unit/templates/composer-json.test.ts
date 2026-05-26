import { describe, expect, it } from 'vitest';
import { composerJson } from '../../../src/bait/templates/composer-json.js';

const ctx = (method: string) => ({
  request: new Request('http://example.test/composer.json', { method }),
  path: '/composer.json',
  category: 'config-leak' as const,
  subcategory: 'php-package-manifest',
});

describe('composer-json', () => {
  it('returns a plausible composer.json with require + autoload', async () => {
    const response = composerJson(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const body = await response.text();
    const parsed = JSON.parse(body);
    expect(parsed.name).toBe('example/app');
    expect(parsed.require).toBeDefined();
    expect(parsed.require.php).toBeDefined();
    expect(parsed.autoload['psr-4']).toBeDefined();
  });

  it('carries no secret-like field (Tier 2 — version disclosure only)', async () => {
    const response = composerJson(ctx('GET'));
    const body = await response.text();
    // Defensive: no obvious credential / token shape leaking in.
    expect(body).not.toMatch(/REDACTED_FOR_HONEYPOT/);
    expect(body).not.toMatch(/password|secret|token|api[_-]?key/i);
  });

  it('emits no canary / tracking headers', () => {
    const response = composerJson(ctx('GET'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
