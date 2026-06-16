import { describe, expect, it } from 'vitest';
import { dockerRegistryBlobs } from '../../../src/bait/templates/docker-registry-blobs.js';
import {
  BASE_LAYER,
  dockerRegistryManifests,
  repoImages,
} from '../../../src/bait/templates/docker-registry-manifests.js';

const ctx = (path: string) => ({
  request: new Request(`http://example.test${path}`),
  path,
  category: 'api-recon' as const,
  subcategory: 'docker-registry',
});

const CONFIG_MEDIA_TYPE = 'application/vnd.docker.container.image.v1+json';
const LAYER_MEDIA_TYPE = 'application/vnd.docker.image.rootfs.diff.tar.gzip';
const GZIP_MAGIC = [0x1f, 0x8b];

interface ImageConfig {
  architecture: string;
  os: string;
  config: { Env: string[]; Cmd: string[] };
  rootfs: { type: string; diff_ids: string[] };
}

describe('docker-registry-blobs', () => {
  it('serves the image config JSON for every advertised config digest', async () => {
    for (const [repo, img] of repoImages) {
      const response = dockerRegistryBlobs(ctx(`/v2/${repo}/blobs/${img.config.digest}`));
      expect(response.status, repo).toBe(200);
      expect(response.headers.get('content-type')).toBe(CONFIG_MEDIA_TYPE);
      expect(response.headers.get('docker-content-digest')).toBe(img.config.digest);
      const cfg = (await response.json()) as ImageConfig;
      expect(cfg.architecture).toBe('amd64');
      expect(cfg.os).toBe('linux');
      expect(Array.isArray(cfg.config.Env)).toBe(true);
      // diff_ids reference the manifest's layers (shared base + app layer).
      expect(cfg.rootfs.diff_ids).toContain(BASE_LAYER.digest);
      expect(cfg.rootfs.diff_ids).toContain(img.appLayer.digest);
    }
  });

  it('config blobs carry only non-actionable decoy secrets', async () => {
    for (const [repo, img] of repoImages) {
      const text = await dockerRegistryBlobs(ctx(`/v2/${repo}/blobs/${img.config.digest}`)).text();
      // Any AWS key is the EXAMPLE placeholder, never a live-shaped key.
      const keys = text.match(/AKIA[0-9A-Z]{16}/g) ?? [];
      for (const k of keys) expect(k).toBe('AKIA1234567890ABCDEF');
      if (/secret/i.test(text)) expect(text).toMatch(/REDACTED_FOR_HONEYPOT|EXAMPLE_/);
    }
  });

  it('serves a valid gzip layer blob for the shared base and every app layer', async () => {
    const layerDigests = [BASE_LAYER.digest, ...repoImages.map(([, img]) => img.appLayer.digest)];
    for (const digest of layerDigests) {
      const response = dockerRegistryBlobs(ctx(`/v2/app/api/blobs/${digest}`));
      expect(response.status, digest).toBe(200);
      expect(response.headers.get('content-type')).toBe(LAYER_MEDIA_TYPE);
      const bytes = new Uint8Array(await response.arrayBuffer());
      expect([bytes[0], bytes[1]]).toEqual(GZIP_MAGIC);
    }
  });

  it('returns BLOB_UNKNOWN 404 for digests the registry does not advertise', async () => {
    const response = dockerRegistryBlobs(
      ctx(
        '/v2/app/api/blobs/sha256:deadbeef00000000000000000000000000000000000000000000000000000000',
      ),
    );
    expect(response.status).toBe(404);
    expect(response.headers.get('docker-distribution-api-version')).toBe('registry/2.0');
    const json = (await response.json()) as { errors: Array<{ code: string }> };
    expect(json.errors[0].code).toBe('BLOB_UNKNOWN');
  });

  it('does not reflect the requested digest into the 404 body', async () => {
    const marker = 'sha256:cafebabe00000000000000000000000000000000000000000000000000000000';
    const text = await dockerRegistryBlobs(ctx(`/v2/app/api/blobs/${marker}`)).text();
    expect(text).not.toContain('cafebabe');
  });

  it('drift guard: every blob a served manifest references is pullable (no dead reference)', async () => {
    for (const [repo, img] of repoImages) {
      const manifest = (await dockerRegistryManifests(
        ctx(`/v2/${repo}/manifests/${img.manifestDigest}`),
      ).json()) as { config: { digest: string }; layers: Array<{ digest: string }> };
      const referenced = [manifest.config.digest, ...manifest.layers.map((l) => l.digest)];
      for (const digest of referenced) {
        const blob = dockerRegistryBlobs(ctx(`/v2/${repo}/blobs/${digest}`));
        expect(blob.status, `${repo} -> ${digest}`).toBe(200);
      }
    }
  });
});
