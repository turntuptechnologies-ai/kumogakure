import { describe, expect, it } from 'vitest';
import { fakeEnvrc } from '../../../src/bait/templates/fake-envrc.js';

const ctx = () => ({
  request: new Request('http://example.test/.envrc'),
  path: '/.envrc',
  category: 'config-leak' as const,
  subcategory: 'direnv',
});

describe('fake-envrc', () => {
  it('serves a direnv .envrc as text', async () => {
    const response = fakeEnvrc(ctx());
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    const text = await response.text();
    // direnv-specific directives — what makes this an .envrc and not a .env.
    expect(text).toMatch(/^layout node$/m);
    expect(text).toMatch(/^dotenv_if_exists /m);
    expect(text).toMatch(/^PATH_add /m);
    expect(text).toMatch(/^export APP_ENV=production$/m);
  });

  it('resolves every secret to the placeholder convention', async () => {
    const text = await fakeEnvrc(ctx()).text();
    const secrets = text.match(/^export \w*(?:SECRET|PASSWORD|TOKEN|KEY|DSN)\w*=(.+)$/gm) ?? [];
    expect(secrets.length).toBeGreaterThan(3);
    for (const s of secrets) {
      expect(s, s).toMatch(/REDACTED_FOR_HONEYPOT|EXAMPLE_AKIA1234567890ABCDEF/);
    }
    expect(text).toMatch(/postgres:\/\/[^:]+:REDACTED_FOR_HONEYPOT@/);
  });

  it('uses only non-routable .invalid hosts', async () => {
    const text = await fakeEnvrc(ctx()).text();
    // Includes the Sentry DSN, whose host sits after a userinfo component.
    const urls = text.match(/https?:\/\/\S+/gi) ?? [];
    expect(urls.length).toBeGreaterThan(1);
    for (const u of urls) expect(u, u).toContain('.invalid');
    expect(text).toMatch(/^export SMTP_USER=\S+\.invalid$/m);
    expect(text).not.toMatch(/\.(?:com|net|org|io|dev|co\.uk)\b/i);
  });

  it('emits no canary / tracking headers', () => {
    const response = fakeEnvrc(ctx());
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });

  it('never reflects the request path', async () => {
    const clean = await fakeEnvrc(ctx()).text();
    const dirty = await fakeEnvrc({
      ...ctx(),
      request: new Request('http://example.test/api/.envrc'),
      path: '/api/.envrc',
    }).text();
    expect(dirty).toBe(clean);
  });
});
