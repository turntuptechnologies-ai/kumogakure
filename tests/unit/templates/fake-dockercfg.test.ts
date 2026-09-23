import { describe, expect, it } from 'vitest';
import { fakeDockercfg } from '../../../src/bait/templates/fake-dockercfg.js';

const ctx = (path: string) => ({
  request: new Request(`http://example.test${path}`),
  path,
  category: 'config-leak' as const,
  subcategory: 'registry-credentials',
});

type AuthMap = Record<string, { auth: string }>;

describe('fake-dockercfg', () => {
  it('serves the legacy flat map for .dockercfg', async () => {
    const response = fakeDockercfg(ctx('/.dockercfg'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const json = (await response.json()) as AuthMap & { auths?: unknown };
    expect(json.auths).toBeUndefined();
    expect(json['https://index.docker.io/v1/']?.auth).toBeTruthy();
  });

  it('serves the auths-wrapped map for .docker/config.json', async () => {
    const json = (await fakeDockercfg(ctx('/root/.docker/config.json')).json()) as {
      auths: AuthMap;
    };
    expect(json.auths['registry.example.invalid']?.auth).toBeTruthy();
  });

  it('encodes only a placeholder credential', async () => {
    const json = (await fakeDockercfg(ctx('/.dockercfg')).json()) as AuthMap;
    for (const [registry, { auth }] of Object.entries(json)) {
      expect(atob(auth), registry).toBe('deploy:REDACTED_FOR_HONEYPOT');
    }
    expect(Object.keys(json).filter((r) => !r.startsWith('https://index.docker.io'))).toEqual([
      'registry.example.invalid',
    ]);
  });

  it('emits no canary / tracking headers', () => {
    const response = fakeDockercfg(ctx('/.dockercfg'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
