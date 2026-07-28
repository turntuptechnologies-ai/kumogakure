import { describe, expect, it } from 'vitest';
import { fakeDockerfile } from '../../../src/bait/templates/fake-dockerfile.js';

const ctx = () => ({
  request: new Request('http://example.test/Dockerfile'),
  path: '/Dockerfile',
  category: 'config-leak' as const,
  subcategory: 'dockerfile',
});

describe('fake-dockerfile', () => {
  it('serves a multi-stage Dockerfile as text', async () => {
    const response = fakeDockerfile(ctx());
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    const text = await response.text();
    expect(text).toMatch(/^FROM node:[\d.]+-alpine AS build$/m);
    expect(text).toMatch(/^FROM node:[\d.]+-alpine AS runtime$/m);
    expect(text).toMatch(/^COPY --from=build/m);
    expect(text).toMatch(/^USER app$/m);
    expect(text).toMatch(/^CMD \[/m);
  });

  it('exposes the ARG/ENV surface scanners grep for', async () => {
    const text = await fakeDockerfile(ctx()).text();
    expect(text).toMatch(/^ARG NPM_TOKEN=/m);
    expect(text).toContain('DATABASE_URL=');
    expect(text).toContain('SESSION_SECRET=');
  });

  it('resolves every secret to the non-actionable placeholder', async () => {
    const text = await fakeDockerfile(ctx()).text();
    const assignments = text.match(/(?:NPM_TOKEN|SESSION_SECRET)=(\S+)/g) ?? [];
    expect(assignments.length).toBeGreaterThan(0);
    for (const a of assignments) expect(a).toContain('REDACTED_FOR_HONEYPOT');
    // The database URL's password component is the placeholder too.
    expect(text).toMatch(/postgres:\/\/[^:]+:REDACTED_FOR_HONEYPOT@/);
  });

  it('uses only non-routable .invalid hosts', async () => {
    const text = await fakeDockerfile(ctx()).text();
    for (const h of text.match(/https?:\/\/([a-z0-9.-]+)/gi) ?? []) {
      // The loopback healthcheck is the one intentional non-.invalid URL.
      if (h.includes('127.0.0.1')) continue;
      expect(h).toContain('.invalid');
    }
    expect(text).not.toMatch(/\.(?:com|net|org|io|dev|co\.uk)\b/i);
  });

  it('emits no canary / tracking headers', () => {
    const response = fakeDockerfile(ctx());
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });

  it('never reflects the request path', async () => {
    const clean = await fakeDockerfile(ctx()).text();
    const dirty = await fakeDockerfile({
      ...ctx(),
      request: new Request('http://example.test/Dockerfile.%3Cscript%3E'),
      path: '/Dockerfile.<script>',
    }).text();
    expect(dirty).toBe(clean);
    expect(dirty).not.toContain('<script>');
  });
});
