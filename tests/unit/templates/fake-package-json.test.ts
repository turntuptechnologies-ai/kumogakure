import { describe, expect, it } from 'vitest';
import { fakePackageJson } from '../../../src/bait/templates/fake-package-json.js';

const ctx = () => ({
  request: new Request('http://example.test/package.json'),
  path: '/package.json',
  category: 'config-leak' as const,
  subcategory: 'js-package-manifest',
});

describe('fake-package-json', () => {
  it('returns a well-formed manifest with pinned dependency versions', async () => {
    const response = fakePackageJson(ctx());
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const json = (await response.json()) as {
      name: string;
      version: string;
      dependencies: Record<string, string>;
    };
    expect(json.name).toBeTruthy();
    expect(json.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(Object.keys(json.dependencies).length).toBeGreaterThan(0);
  });

  it('carries no secret-bearing fields', async () => {
    // Guard against credential KEYS (a dependency named `jsonwebtoken` is
    // fine; a `"password":` field is not).
    const text = await fakePackageJson(ctx()).text();
    expect(text).not.toMatch(/"(password|secret|token|api[_-]?key)"\s*:/i);
  });

  it('emits no canary / tracking headers', () => {
    const response = fakePackageJson(ctx());
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
