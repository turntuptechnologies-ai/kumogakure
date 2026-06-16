import type { TemplateFn } from '../../types.js';
import { BASE_LAYER, repoImages } from './docker-registry-manifests.js';

// Tier 2 decoy for the Docker Registry HTTP API V2 blob endpoint
// (`GET /v2/<name>/blobs/<digest>`). Last hop of the registry probe chain
// (`_catalog` -> `tags/list` -> `manifests/<ref>` -> blobs): having read a
// manifest, a scanner pulls its referenced blobs. The prize is the
// **config blob** (`application/vnd.docker.container.image.v1+json`) whose
// `config.Env` routinely carries the secrets baked into an image —
// DATABASE_URL, JWT_SECRET, cloud keys — which is exactly what registry
// scanners harvest. We serve that config JSON (with non-actionable decoy
// values: `.invalid` hosts, EXAMPLE_/REDACTED placeholders) for the config
// digest of each advertised image, a small valid gzip for the layer digests
// the manifest references, and the registry's BLOB_UNKNOWN 404 otherwise.
//
// The valid-digest set is DERIVED from `repoImages` / `BASE_LAYER` (the
// manifest decoy's source of truth), so any digest a manifest references is
// serveable here; the drift-guard test fails if they ever disagree. Bodies
// are pre-built constants and the attacker-supplied digest is never
// reflected (BLOB_UNKNOWN is fixed) — no reflected-content surface — and a
// `Map` lookup means prototype-chain keys can never resolve to a value.

const CONFIG_MEDIA_TYPE = 'application/vnd.docker.container.image.v1+json';
const LAYER_MEDIA_TYPE = 'application/vnd.docker.image.rootfs.diff.tar.gzip';

// A minimal but well-formed gzip stream (empty payload). A scanner that
// streams or unpacks a layer gets valid—if empty—gzip rather than a 404
// that would contradict the manifest referencing the blob. We never serve
// real layer bytes.
const EMPTY_GZIP = new Uint8Array([
  0x1f, 0x8b, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00,
]);

// Per-repo image-config detail. Service-appropriate, fully fabricated env
// (no live host or secret) — the bait a blob-scraping scanner is after.
const repoConfigDetail: Record<string, { env: string[]; cmd: string[] }> = {
  'app/api': {
    env: [
      'NODE_ENV=production',
      'DATABASE_URL=postgres://app:REDACTED_FOR_HONEYPOT@db.internal.invalid:5432/app',
      'REDIS_URL=redis://cache.internal.invalid:6379/0',
      'JWT_SECRET=EXAMPLE_JWT_SECRET_00000000000000000000',
    ],
    cmd: ['node', 'dist/server.js'],
  },
  'app/web': {
    env: [
      'NODE_ENV=production',
      'API_BASE_URL=https://api.internal.invalid',
      'SENTRY_DSN=https://0000000000000000@sentry.example.invalid/0',
    ],
    cmd: ['node', 'dist/web.js'],
  },
  'app/worker': {
    env: [
      'NODE_ENV=production',
      'DATABASE_URL=postgres://app:REDACTED_FOR_HONEYPOT@db.internal.invalid:5432/app',
      'QUEUE_URL=amqp://mq.internal.invalid:5672',
      'AWS_ACCESS_KEY_ID=EXAMPLE_AKIA1234567890ABCDEF',
      'AWS_SECRET_ACCESS_KEY=REDACTED_FOR_HONEYPOT',
    ],
    cmd: ['node', 'dist/worker.js'],
  },
  'infra/proxy': {
    env: ['UPSTREAM_API=https://api.internal.invalid', 'WORKER_PROCESSES=auto'],
    cmd: ['nginx', '-g', 'daemon off;'],
  },
  'infra/cron': {
    env: [
      'DATABASE_URL=postgres://cron:REDACTED_FOR_HONEYPOT@db.internal.invalid:5432/app',
      'TZ=UTC',
    ],
    cmd: ['/usr/local/bin/cron-runner'],
  },
  'internal/migrator': {
    env: ['DATABASE_URL=postgres://migrator:REDACTED_FOR_HONEYPOT@db.internal.invalid:5432/app'],
    cmd: ['/app/migrate', 'up'],
  },
  'staging/api': {
    env: [
      'NODE_ENV=staging',
      'DATABASE_URL=postgres://app:REDACTED_FOR_HONEYPOT@db.staging.invalid:5432/app',
      'JWT_SECRET=EXAMPLE_JWT_SECRET_STAGING_0000000000',
      'STRIPE_API_KEY=sk_test_EXAMPLE000000000000000000',
    ],
    cmd: ['node', 'dist/server.js'],
  },
};

const PATH_ENV = 'PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin';

function buildConfigBody(repo: string, diffIds: string[]): string {
  const detail = repoConfigDetail[repo] ?? { env: ['NODE_ENV=production'], cmd: ['/bin/sh'] };
  return JSON.stringify({
    architecture: 'amd64',
    os: 'linux',
    created: '2026-05-30T08:14:22Z',
    config: {
      Env: [PATH_ENV, ...detail.env],
      Cmd: detail.cmd,
      WorkingDir: '/app',
      Labels: { 'org.opencontainers.image.title': repo },
    },
    rootfs: { type: 'layers', diff_ids: diffIds },
    history: [
      { created: '2026-05-12T00:00:00Z', created_by: '/bin/sh -c #(nop) ADD base rootfs' },
      {
        created: '2026-05-30T08:14:22Z',
        created_by: `/bin/sh -c #(nop) CMD ${detail.cmd.join(' ')}`,
      },
    ],
  });
}

interface BlobEntry {
  kind: 'config' | 'layer';
  body?: string;
}

// digest -> blob. Config digests carry a per-repo JSON body; layer digests
// (the shared base + each per-repo app layer) share the empty-gzip body.
const blobsByDigest = new Map<string, BlobEntry>();
blobsByDigest.set(BASE_LAYER.digest, { kind: 'layer' });
for (const [repo, img] of repoImages) {
  const diffIds = [BASE_LAYER.digest, img.appLayer.digest];
  blobsByDigest.set(img.config.digest, { kind: 'config', body: buildConfigBody(repo, diffIds) });
  blobsByDigest.set(img.appLayer.digest, { kind: 'layer' });
}

const blobUnknown = JSON.stringify({
  errors: [{ code: 'BLOB_UNKNOWN', message: 'blob unknown to registry' }],
});

const errorHeaders = {
  'Content-Type': 'application/json; charset=UTF-8',
  'Docker-Distribution-Api-Version': 'registry/2.0',
} as const;

// Mirrors the router pattern in `patterns.ts` (same repo character class,
// single-segment digest reference) so route-match and digest extraction
// can never disagree.
const REPO_DIGEST_FROM_PATH = /^\/v2\/[^/]+(?:\/[^/]+)*\/blobs\/([^/]+)$/;

export const dockerRegistryBlobs: TemplateFn = (ctx) => {
  const digest = REPO_DIGEST_FROM_PATH.exec(ctx.path)?.[1];
  const entry = digest !== undefined ? blobsByDigest.get(digest) : undefined;

  if (entry?.kind === 'config' && entry.body !== undefined) {
    return new Response(entry.body, {
      status: 200,
      headers: {
        'Content-Type': CONFIG_MEDIA_TYPE,
        'Docker-Distribution-Api-Version': 'registry/2.0',
        'Docker-Content-Digest': digest as string,
      },
    });
  }

  if (entry?.kind === 'layer') {
    return new Response(EMPTY_GZIP, {
      status: 200,
      headers: {
        'Content-Type': LAYER_MEDIA_TYPE,
        'Docker-Distribution-Api-Version': 'registry/2.0',
        'Docker-Content-Digest': digest as string,
      },
    });
  }

  return new Response(blobUnknown, { status: 404, headers: errorHeaders });
};
