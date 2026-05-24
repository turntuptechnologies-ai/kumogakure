import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for the Docker Registry HTTP API V2 `_catalog` endpoint
// (`GET /v2/_catalog`). The misconfiguration is exposing a `registry:2`
// container without auth — the default — which lets scanners enumerate
// repositories, then pull layers (CWE-200 / CWE-306). Not a single
// product CVE; documented as the registry's own "open registry"
// warning. We return the documented shape `{ repositories: [...] }`
// with invented internal-looking image names.

const body = JSON.stringify({
  repositories: [
    'app/api',
    'app/web',
    'app/worker',
    'infra/proxy',
    'infra/cron',
    'internal/migrator',
    'staging/api',
  ],
});

export const dockerRegistryCatalog: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'Docker-Distribution-Api-Version': 'registry/2.0',
    },
  });
};
