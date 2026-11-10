import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for Cloudflare Workers project config left in a deployed
// docroot: `wrangler.toml` and its JSON spellings `wrangler.json` /
// `wrangler.jsonc`. Scanners want the `account_id`, binding ids (KV / D1 /
// R2) and anything put in `[vars]` — where API tokens routinely end up
// instead of in secrets. The secrets themselves live in `.dev.vars`, which
// is routed to the dotenv decoy.
//
// All values fabricated: `.invalid` hosts, all-zero / repeated-digit ids,
// non-actionable placeholder token (docs/RESPONSE_TEMPLATE_POLICY.md).

const ACCOUNT_ID = '0123456789abcdef0123456789abcdef';
const KV_ID = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const D1_ID = '00000000-0000-4000-8000-000000000000';

const TOML = `name = "app-api"
main = "src/index.ts"
compatibility_date = "2026-06-01"
account_id = "${ACCOUNT_ID}"
workers_dev = false
routes = [{ pattern = "api.example.invalid/*", zone_name = "example.invalid" }]

[vars]
ENVIRONMENT = "production"
API_BASE_URL = "https://api.example.invalid"
UPSTREAM_API_TOKEN = "REDACTED_FOR_HONEYPOT"

[[kv_namespaces]]
binding = "SESSIONS"
id = "${KV_ID}"

[[d1_databases]]
binding = "DB"
database_name = "app-prod"
database_id = "${D1_ID}"

[[r2_buckets]]
binding = "UPLOADS"
bucket_name = "app-uploads"
`;

const JSON_BODY = JSON.stringify(
  {
    $schema: 'node_modules/wrangler/config-schema.json',
    name: 'app-api',
    main: 'src/index.ts',
    compatibility_date: '2026-06-01',
    account_id: ACCOUNT_ID,
    workers_dev: false,
    routes: [{ pattern: 'api.example.invalid/*', zone_name: 'example.invalid' }],
    vars: {
      ENVIRONMENT: 'production',
      API_BASE_URL: 'https://api.example.invalid',
      UPSTREAM_API_TOKEN: 'REDACTED_FOR_HONEYPOT',
    },
    kv_namespaces: [{ binding: 'SESSIONS', id: KV_ID }],
    d1_databases: [{ binding: 'DB', database_name: 'app-prod', database_id: D1_ID }],
    r2_buckets: [{ binding: 'UPLOADS', bucket_name: 'app-uploads' }],
  },
  null,
  2,
);

export const fakeWranglerConfig: TemplateFn = (ctx) => {
  const isToml = ctx.path.endsWith('.toml');
  return new Response(isToml ? TOML : JSON_BODY, {
    status: 200,
    headers: {
      'Content-Type': isToml ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
    },
  });
};
