import { describe, expect, it } from 'vitest';
import { dockerRegistryCatalog } from '../../../src/bait/templates/docker-registry-catalog.js';
import { dockerRegistryTags, tagRepos } from '../../../src/bait/templates/docker-registry-tags.js';

const ctx = (path: string) => ({
  request: new Request(`http://example.test${path}`),
  path,
  category: 'api-recon' as const,
  subcategory: 'docker-registry',
});

// Literal, human-readable source of truth, asserted below to equal BOTH
// the template's live key set (`tagRepos`) and the repositories the
// `_catalog` decoy advertises.
const EXPECTED = [
  'app/api',
  'app/web',
  'app/worker',
  'infra/proxy',
  'infra/cron',
  'internal/migrator',
  'staging/api',
];

describe('docker-registry-tags', () => {
  it('returns the documented {name, tags} shape for every served repository', async () => {
    for (const repo of tagRepos) {
      const response = dockerRegistryTags(ctx(`/v2/${repo}/tags/list`));
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');
      expect(response.headers.get('docker-distribution-api-version')).toBe('registry/2.0');
      const parsed = JSON.parse(await response.text()) as { name: string; tags: string[] };
      expect(parsed.name).toBe(repo);
      expect(Array.isArray(parsed.tags)).toBe(true);
      expect(parsed.tags.length).toBeGreaterThan(0);
      expect(parsed.tags).toContain('latest');
    }
  });

  it('returns a real NAME_UNKNOWN 404 for repositories not in the catalog', async () => {
    for (const repo of ['app/unknown', 'does/not-exist', 'random', 'app/api/extra']) {
      const response = dockerRegistryTags(ctx(`/v2/${repo}/tags/list`));
      expect(response.status).toBe(404);
      expect(response.headers.get('docker-distribution-api-version')).toBe('registry/2.0');
      const parsed = JSON.parse(await response.text()) as {
        errors: Array<{ code: string; message: string }>;
      };
      expect(parsed.errors[0].code).toBe('NAME_UNKNOWN');
    }
  });

  it('does not reflect the requested repository name into the response', async () => {
    // A name carrying markup must come back as the generic NAME_UNKNOWN
    // body, never echoed — guards against reflected-content / XSS and is
    // the reason the table stores pre-serialised constant bodies.
    const injected = '<script>alert(1)</script>';
    const response = dockerRegistryTags(ctx(`/v2/${injected}/tags/list`));
    expect(response.status).toBe(404);
    const text = await response.text();
    expect(text).not.toContain('<script>');
    expect(text).not.toContain(injected);
  });

  it('is not fooled by prototype-chain keys (Map lookup, not object index)', async () => {
    for (const repo of ['__proto__', 'constructor', 'toString', 'hasOwnProperty']) {
      const response = dockerRegistryTags(ctx(`/v2/${repo}/tags/list`));
      expect(response.status).toBe(404);
      const parsed = JSON.parse(await response.text()) as { errors: Array<{ code: string }> };
      expect(parsed.errors[0].code).toBe('NAME_UNKNOWN');
    }
  });

  it('emits no canary / tracking headers', () => {
    const response = dockerRegistryTags(ctx('/v2/app/api/tags/list'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });

  it('sets only registry-appropriate headers (no stray fingerprint header from the template)', () => {
    // The anti-fingerprint guard with teeth: assert the template emits
    // nothing outside the registry allowlist. `Server` / `X-Powered-By`
    // are added later by the fingerprint layer, never here; an accidental
    // header added in this template would be caught by this.
    const allowed = new Set(['content-type', 'docker-distribution-api-version', 'content-length']);
    for (const path of ['/v2/app/api/tags/list', '/v2/nope/tags/list']) {
      const response = dockerRegistryTags(ctx(path));
      for (const name of response.headers.keys()) {
        expect(allowed.has(name.toLowerCase())).toBe(true);
      }
    }
  });

  it('serves exactly the repositories the _catalog decoy advertises (both directions)', async () => {
    // Drift guard. `tagRepos` is the template's live key set; it must
    // equal what `_catalog` lists AND the literal EXPECTED set. Adding a
    // repo to one side without the others now fails here — closing the
    // "served a repo the catalog never named" fingerprint hole.
    const catalog = JSON.parse(await dockerRegistryCatalog(ctx('/v2/_catalog')).text()) as {
      repositories: string[];
    };
    const sortedCatalog = [...catalog.repositories].sort();
    expect([...tagRepos].sort()).toEqual(sortedCatalog);
    expect([...EXPECTED].sort()).toEqual(sortedCatalog);
    for (const repo of catalog.repositories) {
      expect(dockerRegistryTags(ctx(`/v2/${repo}/tags/list`)).status).toBe(200);
    }
  });
});
