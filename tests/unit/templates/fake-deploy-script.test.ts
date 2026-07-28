import { describe, expect, it } from 'vitest';
import { fakeDeployScript } from '../../../src/bait/templates/fake-deploy-script.js';

const ctx = () => ({
  request: new Request('http://example.test/deploy.sh'),
  path: '/deploy.sh',
  category: 'config-leak' as const,
  subcategory: 'deploy-script',
});

describe('fake-deploy-script', () => {
  it('serves a bash deploy script', async () => {
    const response = fakeDeployScript(ctx());
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('shellscript');
    const text = await response.text();
    expect(text.startsWith('#!/usr/bin/env bash')).toBe(true);
    expect(text).toMatch(/^set -euo pipefail$/m);
    expect(text).toMatch(/^trap /m);
  });

  it('discloses the deploy topology a scanner is after', async () => {
    const text = await fakeDeployScript(ctx()).text();
    expect(text).toContain('DEPLOY_HOSTS=');
    expect(text).toContain('rsync');
    expect(text).toContain('docker push');
    expect(text).toContain('migrations/latest.sql');
  });

  it('reads every secret from the environment with a guard, never inlined', async () => {
    const text = await fakeDeployScript(ctx()).text();
    for (const v of ['DEPLOY_SSH_KEY', 'REGISTRY_PASSWORD', 'DB_PASSWORD']) {
      // `${VAR:?message}` form — set from the environment, fails loudly if absent.
      expect(text, v).toMatch(new RegExp(`\\$\\{${v}:\\?`));
    }
    expect(text).not.toMatch(/(password|secret|token|api[_-]?key)=["']?[A-Za-z0-9/+]{12,}["']?$/im);
  });

  it('uses only non-routable .invalid hosts', async () => {
    const text = await fakeDeployScript(ctx()).text();
    for (const h of text.match(/https?:\/\/([a-z0-9.-]+)/gi) ?? []) {
      // Host URLs are built from the .invalid DEPLOY_HOSTS entries.
      expect(h === 'https://${' || h.includes('.invalid')).toBe(true);
    }
    expect(text).toContain('app-01.internal.invalid');
    expect(text).not.toMatch(/\.(?:com|net|org|io|dev|co\.uk)\b/i);
  });

  it('emits no canary / tracking headers', () => {
    const response = fakeDeployScript(ctx());
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });

  it('never reflects the request path', async () => {
    const clean = await fakeDeployScript(ctx()).text();
    const dirty = await fakeDeployScript({
      ...ctx(),
      request: new Request('http://example.test/bin/release.sh'),
      path: '/bin/release.sh',
    }).text();
    expect(dirty).toBe(clean);
  });
});
