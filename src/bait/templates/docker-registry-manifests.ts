import type { TemplateFn } from '../../types.js';
import { repoTagSets } from './docker-registry-tags.js';

// Tier 3 decoy for the Docker Registry HTTP API V2 manifest endpoint
// (`GET /v2/<name>/manifests/<reference>`). Follow-on from `_catalog` ->
// `tags/list`: a scanner reads the tag list for an advertised repository
// and then pulls the manifest for each tag to inventory the image
// (config digest, layer sizes/digests, total size). We return a
// well-formed schema-2 image manifest for exactly the (repo, tag) pairs
// `tags/list` advertises — plus the manifest's own content digest as a
// valid reference — and the registry's real MANIFEST_UNKNOWN 404 for
// anything else.
//
// Why per-repo (not per-tag) manifests: a registry routinely points
// several mutable tags (`latest`, `v2.8.1`, `main`, …) at the same
// digest, so one manifest per repository is realistic and keeps the
// table small. Images also share a common base layer, modelled here by
// reusing BASE_LAYER across repos (a monorepo built on one runtime base).
//
// As with the tags decoy the bodies are pre-serialised constants and the
// attacker-supplied reference is never reflected into the response
// (MANIFEST_UNKNOWN is a fixed body) — no reflected-content / CodeQL
// surface — and a `Map` lookup means prototype-chain references
// (`__proto__`, `constructor`, …) can never resolve to a value.
//
// The served (repo, tag) set is DERIVED from `repoTagSets` (the tags
// decoy's source of truth), so a tag added to `tags/list` is
// automatically serveable here; the drift-guard test fails if the two
// ever disagree.

const MANIFEST_MEDIA_TYPE = 'application/vnd.docker.distribution.manifest.v2+json';
const CONFIG_MEDIA_TYPE = 'application/vnd.docker.container.image.v1+json';
const LAYER_MEDIA_TYPE = 'application/vnd.docker.image.rootfs.diff.tar.gzip';

// Shared runtime base layer reused across the images — realistic for a
// set of services built FROM the same base.
const BASE_LAYER = {
  mediaType: LAYER_MEDIA_TYPE,
  size: 3372971,
  digest: 'sha256:9b794450f7b6db9c1bb0d9d4e5e7c2a1f0e3d8b76c5a4938271605f4e3d2c1b0',
};

interface RepoImage {
  /** `Docker-Content-Digest` of the served manifest; also accepted as a
   *  pull-by-digest reference (`/manifests/sha256:…`). */
  manifestDigest: string;
  config: { size: number; digest: string };
  /** Per-repo application layer stacked on top of the shared base. */
  appLayer: { size: number; digest: string };
}

const repoImages: ReadonlyArray<readonly [string, RepoImage]> = [
  [
    'app/api',
    {
      manifestDigest: 'sha256:a1b2c3d4e5f60718293a4b5c6d7e8f90112233445566778899aabbccddeeff00',
      config: {
        size: 7412,
        digest: 'sha256:0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
      },
      appLayer: {
        size: 28510234,
        digest: 'sha256:f1e2d3c4b5a6978869584736251403f2e1d0c9b8a7968574635241302f1e0dca',
      },
    },
  ],
  [
    'app/web',
    {
      manifestDigest: 'sha256:b2c3d4e5f60718293a4b5c6d7e8f9011223344556677889aabbccddeeff00112',
      config: {
        size: 6987,
        digest: 'sha256:1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c',
      },
      appLayer: {
        size: 41230876,
        digest: 'sha256:e2d3c4b5a6978869584736251403f2e1d0c9b8a79685746352413020f1e0dcab',
      },
    },
  ],
  [
    'app/worker',
    {
      manifestDigest: 'sha256:c3d4e5f607182930405b6d7e8f9011223344556677889aabbccddeeff0011223',
      config: {
        size: 7104,
        digest: 'sha256:2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d',
      },
      appLayer: {
        size: 26944512,
        digest: 'sha256:d3c4b5a69788695847362514031e2d0c9b8a79685746352413020a1f0edcab12',
      },
    },
  ],
  [
    'infra/proxy',
    {
      manifestDigest: 'sha256:d4e5f60718293040506d7e8f90112233445566778899aabbccddeeff00112233',
      config: {
        size: 5231,
        digest: 'sha256:3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e',
      },
      appLayer: {
        size: 8821044,
        digest: 'sha256:c4b5a6978869584736251403f2e1d0c9b8a7968574635241302010f0edcab12a',
      },
    },
  ],
  [
    'infra/cron',
    {
      manifestDigest: 'sha256:e5f60718293040506070e8f9011223344556677889aabbccddeeff0011223344',
      config: {
        size: 5044,
        digest: 'sha256:4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f',
      },
      appLayer: {
        size: 7615329,
        digest: 'sha256:b5a6978869584736251403f2e1d0c9b8a796857463524130201f0edcab123456',
      },
    },
  ],
  [
    'internal/migrator',
    {
      manifestDigest: 'sha256:f60718293040506070801f9011223344556677889aabbccddeeff00112233445',
      config: {
        size: 4890,
        digest: 'sha256:5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a',
      },
      appLayer: {
        size: 12044871,
        digest: 'sha256:a6978869584736251403f2e1d0c9b8a7968574635241302010f0edcab1234567',
      },
    },
  ],
  [
    'staging/api',
    {
      manifestDigest: 'sha256:0718293040506070809011223344556677889aabbccddeeff001122334455667',
      config: {
        size: 7533,
        digest: 'sha256:6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b',
      },
      appLayer: {
        size: 29381760,
        digest: 'sha256:9788695847362514031e2d0c9b8a79685746352413020f0edcab123456789012',
      },
    },
  ],
];

interface ManifestEntry {
  body: string;
  digest: string;
  refs: Set<string>;
}

const tagsForRepo = new Map<string, readonly string[]>(repoTagSets);

const manifestsByRepo = new Map<string, ManifestEntry>(
  repoImages.map(([repo, img]) => {
    const body = JSON.stringify({
      schemaVersion: 2,
      mediaType: MANIFEST_MEDIA_TYPE,
      config: { mediaType: CONFIG_MEDIA_TYPE, size: img.config.size, digest: img.config.digest },
      layers: [
        BASE_LAYER,
        { mediaType: LAYER_MEDIA_TYPE, size: img.appLayer.size, digest: img.appLayer.digest },
      ],
    });
    // Valid references = every tag `tags/list` advertises for this repo,
    // plus the manifest's own content digest (pull-by-digest).
    const refs = new Set<string>(tagsForRepo.get(repo) ?? []);
    refs.add(img.manifestDigest);
    return [repo, { body, digest: img.manifestDigest, refs }];
  }),
);

// Exposed for the drift-guard test: the repositories this decoy serves
// manifests for. Must equal what `_catalog` advertises and what
// `tags/list` serves.
export const manifestRepos = [...manifestsByRepo.keys()];

const manifestUnknown = JSON.stringify({
  errors: [{ code: 'MANIFEST_UNKNOWN', message: 'manifest unknown' }],
});

const errorHeaders = {
  'Content-Type': 'application/json; charset=UTF-8',
  'Docker-Distribution-Api-Version': 'registry/2.0',
} as const;

// Mirrors the router pattern in `patterns.ts` exactly (same character
// class for the repo segment, single-segment reference) so route-match
// and repo/reference extraction can never disagree.
const REPO_REF_FROM_PATH = /^\/v2\/([^/]+(?:\/[^/]+)*)\/manifests\/([^/]+)$/;

export const dockerRegistryManifests: TemplateFn = (ctx) => {
  const match = REPO_REF_FROM_PATH.exec(ctx.path);
  const repo = match?.[1];
  const reference = match?.[2];
  const entry = repo !== undefined ? manifestsByRepo.get(repo) : undefined;

  if (entry !== undefined && reference !== undefined && entry.refs.has(reference)) {
    return new Response(entry.body, {
      status: 200,
      headers: {
        'Content-Type': MANIFEST_MEDIA_TYPE,
        'Docker-Distribution-Api-Version': 'registry/2.0',
        'Docker-Content-Digest': entry.digest,
      },
    });
  }

  return new Response(manifestUnknown, { status: 404, headers: errorHeaders });
};
