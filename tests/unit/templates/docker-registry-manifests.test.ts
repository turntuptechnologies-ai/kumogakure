import { describe, expect, it } from 'vitest';
import { dockerRegistryCatalog } from '../../../src/bait/templates/docker-registry-catalog.js';
import {
  dockerRegistryManifests,
  manifestRepos,
} from '../../../src/bait/templates/docker-registry-manifests.js';
import { repoTagSets } from '../../../src/bait/templates/docker-registry-tags.js';

const ctx = (path: string) => ({
  request: new Request(`http://example.test${path}`),
  path,
  category: 'api-recon' as const,
  subcategory: 'docker-registry',
});

const DIGEST_RE = /^sha256:[0-9a-f]{64}$/;
const MANIFEST_MEDIA_TYPE = 'application/vnd.docker.distribution.manifest.v2+json';

interface ImageManifest {
  schemaVersion: number;
  mediaType: string;
  config: { mediaType: string; size: number; digest: string };
  layers: Array<{ mediaType: string; size: number; digest: string }>;
}

describe('docker-registry-manifests', () => {
  it('serves a valid schema-2 manifest for every advertised (repo, tag) pair', async () => {
    for (const [repo, tags] of repoTagSets) {
      for (const tag of tags) {
        const response = dockerRegistryManifests(ctx(`/v2/${repo}/manifests/${tag}`));
        expect(response.status, `${repo}:${tag}`).toBe(200);
        expect(response.headers.get('content-type')).toBe(MANIFEST_MEDIA_TYPE);
        expect(response.headers.get('docker-distribution-api-version')).toBe('registry/2.0');
        expect(response.headers.get('docker-content-digest')).toMatch(DIGEST_RE);

        const manifest = JSON.parse(await response.text()) as ImageManifest;
        expect(manifest.schemaVersion).toBe(2);
        expect(manifest.mediaType).toBe(MANIFEST_MEDIA_TYPE);
        expect(manifest.config.digest).toMatch(DIGEST_RE);
        expect(manifest.config.size).toBeGreaterThan(0);
        expect(manifest.layers.length).toBeGreaterThan(0);
        for (const layer of manifest.layers) {
          expect(layer.digest).toMatch(DIGEST_RE);
          expect(layer.size).toBeGreaterThan(0);
        }
      }
    }
  });

  it('accepts pull-by-digest using the manifest content digest it returned', async () => {
    // A scanner that reads `Docker-Content-Digest` and re-requests the
    // manifest by digest must get the same 200, not a MANIFEST_UNKNOWN.
    for (const [repo, tags] of repoTagSets) {
      const byTag = dockerRegistryManifests(ctx(`/v2/${repo}/manifests/${tags[0]}`));
      const digest = byTag.headers.get('docker-content-digest');
      expect(digest).toMatch(DIGEST_RE);
      const byDigest = dockerRegistryManifests(ctx(`/v2/${repo}/manifests/${digest}`));
      expect(byDigest.status).toBe(200);
      expect(await byDigest.text()).toBe(await byTag.text());
    }
  });

  it('returns a real MANIFEST_UNKNOWN 404 for tags the repo does not advertise', async () => {
    for (const path of [
      '/v2/app/api/manifests/v9.9.9', // known repo, unknown tag
      '/v2/app/api/manifests/does-not-exist',
      '/v2/no/such-repo/manifests/latest', // unknown repo
      '/v2/random/manifests/latest',
    ]) {
      const response = dockerRegistryManifests(ctx(path));
      expect(response.status, path).toBe(404);
      expect(response.headers.get('docker-distribution-api-version')).toBe('registry/2.0');
      const parsed = JSON.parse(await response.text()) as {
        errors: Array<{ code: string; message: string }>;
      };
      expect(parsed.errors[0].code).toBe('MANIFEST_UNKNOWN');
    }
  });

  it('does not reflect the requested reference into the response', async () => {
    // An unknown reference carrying markup must come back as the generic
    // MANIFEST_UNKNOWN body, never echoed — the reason error/tag detail
    // is omitted and bodies are pre-serialised constants.
    const injected = '<script>alert(1)</script>';
    const response = dockerRegistryManifests(ctx(`/v2/app/api/manifests/${injected}`));
    expect(response.status).toBe(404);
    const text = await response.text();
    expect(text).not.toContain('<script>');
    expect(text).not.toContain(injected);
  });

  it('is not fooled by prototype-chain repository names (Map lookup, not object index)', async () => {
    for (const repo of ['__proto__', 'constructor', 'toString', 'hasOwnProperty']) {
      const response = dockerRegistryManifests(ctx(`/v2/${repo}/manifests/latest`));
      expect(response.status).toBe(404);
      const parsed = JSON.parse(await response.text()) as { errors: Array<{ code: string }> };
      expect(parsed.errors[0].code).toBe('MANIFEST_UNKNOWN');
    }
  });

  it('emits no canary / tracking headers', () => {
    const response = dockerRegistryManifests(ctx('/v2/app/api/manifests/latest'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });

  it('sets only registry-appropriate headers (no stray fingerprint header from the template)', () => {
    const allowedOnHit = new Set([
      'content-type',
      'docker-distribution-api-version',
      'docker-content-digest',
      'content-length',
    ]);
    const hit = dockerRegistryManifests(ctx('/v2/app/api/manifests/latest'));
    for (const name of hit.headers.keys()) {
      expect(allowedOnHit.has(name.toLowerCase()), name).toBe(true);
    }
    const miss = dockerRegistryManifests(ctx('/v2/app/api/manifests/nope'));
    const allowedOnMiss = new Set([
      'content-type',
      'docker-distribution-api-version',
      'content-length',
    ]);
    for (const name of miss.headers.keys()) {
      expect(allowedOnMiss.has(name.toLowerCase()), name).toBe(true);
    }
  });

  it('uses well-formed, unique digests across all served manifests', () => {
    // A miscounted digest (not 64 hex) or an accidental copy-paste
    // collision between repos would be a fingerprint; pin both here.
    const seen = new Set<string>();
    for (const [repo, tags] of repoTagSets) {
      const response = dockerRegistryManifests(ctx(`/v2/${repo}/manifests/${tags[0]}`));
      const digest = response.headers.get('docker-content-digest') ?? '';
      expect(digest).toMatch(DIGEST_RE);
      expect(seen.has(digest), `duplicate manifest digest for ${repo}`).toBe(false);
      seen.add(digest);
    }
  });

  it('serves manifests for exactly the repositories _catalog advertises and tags/list serves', async () => {
    // Drift guard across all three surfaces. `manifestRepos` is the live
    // key set; it must equal what `_catalog` lists AND the repositories
    // `tags/list` serves. Adding a repo or tag to one side without the
    // others fails here.
    const catalog = JSON.parse(await dockerRegistryCatalog(ctx('/v2/_catalog')).text()) as {
      repositories: string[];
    };
    const sortedCatalog = [...catalog.repositories].sort();
    expect([...manifestRepos].sort()).toEqual(sortedCatalog);
    expect(repoTagSets.map(([repo]) => repo).sort()).toEqual(sortedCatalog);

    // Every (repo, tag) the tags decoy advertises must resolve to a 200
    // manifest — no tag we named but cannot serve.
    for (const [repo, tags] of repoTagSets) {
      for (const tag of tags) {
        expect(
          dockerRegistryManifests(ctx(`/v2/${repo}/manifests/${tag}`)).status,
          `${repo}:${tag}`,
        ).toBe(200);
      }
    }
  });
});
