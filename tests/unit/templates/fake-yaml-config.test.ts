import { describe, expect, it } from 'vitest';
import { fakeYamlConfig } from '../../../src/bait/templates/fake-yaml-config.js';

const ctx = (subcategory: string | undefined, path: string) => ({
  request: new Request(`http://example.test${path}`),
  path,
  category: 'config-leak' as const,
  subcategory,
});

// Each document must be identifiable by a marker only its own schema uses,
// so a subcategory wired to the wrong body fails.
const docs: Array<[string, string, RegExp]> = [
  ['yaml-config', '/config.yml', /^database:$/m],
  ['rails-secrets', '/secrets.yml', /^ {2}secret_key_base: /m],
  ['cloud-credentials', '/aws.yml', /^ {2}access_key_id: EXAMPLE_/m],
];

describe('fake-yaml-config', () => {
  it('serves the schema-correct document for each subcategory', async () => {
    for (const [subcategory, path, marker] of docs) {
      const response = fakeYamlConfig(ctx(subcategory, path));
      expect(response.status, subcategory).toBe(200);
      expect(response.headers.get('content-type'), subcategory).toContain('yaml');
      expect(await response.text(), subcategory).toMatch(marker);
    }
  });

  it('falls back to the generic app config for an absent subcategory', async () => {
    const text = await fakeYamlConfig(ctx(undefined, '/config.yml')).text();
    expect(text).toMatch(/^database:$/m);
  });

  it('carries only placeholder secrets and .invalid hosts', async () => {
    for (const [subcategory, path] of docs) {
      const text = await fakeYamlConfig(ctx(subcategory, path)).text();
      expect(text, subcategory).toContain('REDACTED_FOR_HONEYPOT');
      expect(text, subcategory).not.toMatch(/\.(?:com|net|org|io)\b/);
    }
    expect(await fakeYamlConfig(ctx('yaml-config', '/config.yml')).text()).toContain(
      'db.example.invalid',
    );
  });

  it('emits no canary / tracking headers', () => {
    const response = fakeYamlConfig(ctx('yaml-config', '/config.yml'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
