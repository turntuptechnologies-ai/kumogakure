import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for the Docker Registry HTTP API V2 base / version-check
// endpoint (`GET /v2/`). A `registry:2` container left without auth —
// the default open-registry misconfiguration that the `_catalog` decoy
// already models — answers this probe with `200 {}` and the
// `Docker-Distribution-Api-Version` header. Tools and scanners hit
// `/v2/` first to confirm a registry is present, then walk
// `_catalog` -> `<repo>/tags/list`. Serving it keeps the registry
// surface internally consistent: answering `_catalog` / `tags/list`
// while 404-ing `/v2/` would itself be a honeypot fingerprint.

const body = '{}';

export const dockerRegistryBase: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'Docker-Distribution-Api-Version': 'registry/2.0',
    },
  });
};
