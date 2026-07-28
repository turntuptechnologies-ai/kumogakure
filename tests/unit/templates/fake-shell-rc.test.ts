import { describe, expect, it } from 'vitest';
import { fakeShellRc } from '../../../src/bait/templates/fake-shell-rc.js';

const ctx = () => ({
  request: new Request('http://example.test/.bashrc'),
  path: '/.bashrc',
  category: 'config-leak' as const,
  subcategory: 'shell-rc',
});

describe('fake-shell-rc', () => {
  it('serves a plausible .bashrc as text', async () => {
    const response = fakeShellRc(ctx());
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    const text = await response.text();
    // The non-interactive early return every distro .bashrc opens with.
    expect(text).toContain('case $- in');
    expect(text).toMatch(/^HISTCONTROL=/m);
    expect(text).toMatch(/^shopt -s histappend$/m);
    expect(text).toMatch(/^alias ll=/m);
  });

  it('carries the operator additions a scanner greps for', async () => {
    const text = await fakeShellRc(ctx()).text();
    expect(text).toMatch(/^export PGPASSWORD=/m);
    expect(text).toMatch(/^export AWS_ACCESS_KEY_ID=/m);
    expect(text).toMatch(/^export REGISTRY_PASSWORD=/m);
  });

  it('resolves every exported secret to the placeholder convention', async () => {
    const text = await fakeShellRc(ctx()).text();
    const secrets = text.match(/^export \w*(?:PASSWORD|SECRET|TOKEN|PWD|KEY_ID)\w*=(.+)$/gm) ?? [];
    expect(secrets.length).toBeGreaterThan(3);
    for (const s of secrets) {
      expect(s, s).toMatch(/REDACTED_FOR_HONEYPOT|EXAMPLE_AKIA1234567890ABCDEF/);
    }
  });

  it('uses only non-routable .invalid hosts', async () => {
    const text = await fakeShellRc(ctx()).text();
    expect(text).toContain('db.internal.invalid');
    expect(text).toContain('app-01.internal.invalid');
    expect(text).not.toMatch(/\.(?:com|net|org|io|dev|co\.uk)\b/i);
  });

  it('emits no canary / tracking headers', () => {
    const response = fakeShellRc(ctx());
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });

  it('serves the same body for every member of the rc family', async () => {
    const a = await fakeShellRc(ctx()).text();
    const b = await fakeShellRc({
      ...ctx(),
      request: new Request('http://example.test/home/deploy/.zshrc'),
      path: '/home/deploy/.zshrc',
    }).text();
    expect(b).toBe(a);
  });
});
