import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for the Docker Registry HTTP API V2 tag-list endpoint
// (`GET /v2/<name>/tags/list`). Follow-on from the `_catalog` decoy: a
// scanner reads `_catalog`, then enumerates `tags/list` for each
// advertised repository. The documented response shape is
// `{ "name": "<repo>", "tags": [ ... ] }`.
//
// Routing is path-only and the repository name is variable, so the
// response is chosen by EXACT lookup against a fixed table of the
// repositories `_catalog` advertises. The values are pre-serialised
// constants — the attacker-supplied path segment is never reflected
// into the response body (avoids reflected-content / CodeQL concerns),
// and a `Map` lookup means prototype-chain keys (`__proto__`,
// `constructor`, …) can never resolve to a value. Any repository not in
// the table returns the registry's real `NAME_UNKNOWN` 404, which is
// also what a scanner probing guessed names would expect.
//
// Keep the keys here in sync with the repository list advertised by
// `docker-registry-catalog.ts` (the templates-unit test guards drift).
const tagsByRepo = new Map<string, string>([
  [
    'app/api',
    JSON.stringify({
      name: 'app/api',
      tags: ['latest', 'v2.8.1', 'v2.8.0', 'v2.7.4', 'main', 'sha-7f3c9a2'],
    }),
  ],
  [
    'app/web',
    JSON.stringify({
      name: 'app/web',
      tags: ['latest', 'v2.8.1', 'v2.8.0', 'v2.7.4', 'main', 'sha-1b8e4d0'],
    }),
  ],
  [
    'app/worker',
    JSON.stringify({
      name: 'app/worker',
      tags: ['latest', 'v2.8.1', 'v2.7.4', 'main', 'sha-c4a9f17'],
    }),
  ],
  [
    'infra/proxy',
    JSON.stringify({ name: 'infra/proxy', tags: ['latest', 'stable', '1.25-alpine', 'v1.4.2'] }),
  ],
  [
    'infra/cron',
    JSON.stringify({ name: 'infra/cron', tags: ['latest', 'v0.6.3', 'v0.6.2', 'main'] }),
  ],
  [
    'internal/migrator',
    JSON.stringify({ name: 'internal/migrator', tags: ['latest', 'v0.9.2', 'v0.9.1', 'v0.8.0'] }),
  ],
  [
    'staging/api',
    JSON.stringify({
      name: 'staging/api',
      tags: ['latest', 'staging', 'v2.9.0-rc1', 'main', 'sha-9f3c2a1'],
    }),
  ],
]);

// The exact set of repositories this decoy serves tags for. Exposed so
// the drift-guard test can assert it equals what `_catalog` advertises
// in BOTH directions — neither a repo the catalog lists but we 404, nor
// a repo we 200 that the catalog never named (which would itself be a
// honeypot fingerprint to a scanner guessing names).
export const tagRepos = [...tagsByRepo.keys()];

const nameUnknown = JSON.stringify({
  errors: [{ code: 'NAME_UNKNOWN', message: 'repository name not known to registry' }],
});

const headers = {
  'Content-Type': 'application/json; charset=UTF-8',
  'Docker-Distribution-Api-Version': 'registry/2.0',
} as const;

// Mirrors the router pattern in `patterns.ts` exactly (same character
// class, not a laxer `.+`) so route-match and repo-extraction can never
// disagree about what counts as the repository segment.
const REPO_FROM_PATH = /^\/v2\/([^/]+(?:\/[^/]+)*)\/tags\/list$/;

export const dockerRegistryTags: TemplateFn = (ctx) => {
  const repo = REPO_FROM_PATH.exec(ctx.path)?.[1];
  const found = repo !== undefined ? tagsByRepo.get(repo) : undefined;

  if (found !== undefined) {
    return new Response(found, { status: 200, headers });
  }

  return new Response(nameUnknown, { status: 404, headers });
};
