import { describe, expect, it } from 'vitest';
import { fakeGaeAppYaml } from '../../../src/bait/templates/fake-gae-app-yaml.js';

const ctx = () => ({
  request: new Request('http://example.test/app.yaml'),
  path: '/app.yaml',
  category: 'config-leak' as const,
  subcategory: 'gae-app-yaml',
});

describe('fake-gae-app-yaml', () => {
  it('serves an App Engine service descriptor as YAML', async () => {
    const response = fakeGaeAppYaml(ctx());
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('yaml');
    const text = await response.text();
    expect(text).toMatch(/^runtime: /m);
    expect(text).toMatch(/^entrypoint: /m);
    expect(text).toMatch(/^automatic_scaling:$/m);
    expect(text).toMatch(/^env_variables:$/m);
    expect(text).toMatch(/^handlers:$/m);
  });

  it('resolves every env_variables secret to the placeholder', async () => {
    const text = await fakeGaeAppYaml(ctx()).text();
    const secrets = text.match(/^ +(?:\w*(?:SECRET|KEY|PASSWORD|TOKEN)\w*): (.+)$/gm) ?? [];
    expect(secrets.length).toBeGreaterThan(2);
    for (const s of secrets) expect(s, s).toContain('REDACTED_FOR_HONEYPOT');
    expect(text).toMatch(/postgres:\/\/[^:]+:REDACTED_FOR_HONEYPOT@/);
  });

  it('uses only non-routable .invalid hosts', async () => {
    const text = await fakeGaeAppYaml(ctx()).text();
    for (const h of text.match(/https?:\/\/([a-z0-9.-]+)/gi) ?? []) {
      expect(h).toContain('.invalid');
    }
    expect(text).toContain('app.example.invalid');
    expect(text).not.toMatch(/\.(?:com|net|org|io|dev|co\.uk)\b/i);
  });

  it('emits no canary / tracking headers', () => {
    const response = fakeGaeAppYaml(ctx());
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });

  it('never reflects the request path', async () => {
    const clean = await fakeGaeAppYaml(ctx()).text();
    const dirty = await fakeGaeAppYaml({
      ...ctx(),
      request: new Request('http://example.test/svc/app.yaml'),
      path: '/svc/app.yaml',
    }).text();
    expect(dirty).toBe(clean);
  });
});
