# kumogakure

A serverless low-interaction web honeypot for Cloudflare Workers.

> **kumogakure** (雲隠れ) — "hiding in the clouds", a classical ninja technique of
> vanishing into thin air, leaving the enemy to attack a phantom. This project
> presents a phantom of vulnerable web services on Cloudflare's edge, while you
> observe attackers from concealment.

## What it does

- Serves decoy responses on a catalog of paths commonly probed by attackers and
  vulnerability scanners (WordPress admin, `.env` files, Spring Actuator, cloud
  metadata endpoints, and more).
- Logs every request to Cloudflare D1, with full headers and request bodies
  offloaded to R2 when they contain interesting payloads.
- Flags requests carrying known exploit signatures (Log4Shell, Spring4Shell,
  SQLi, XSS, path traversal, SSTI, SSRF, and others).
- Runs entirely within the Cloudflare Free Tier.

## Stack

- TypeScript on Cloudflare Workers
- [Hono](https://hono.dev) for routing
- Cloudflare D1 for request metadata
- Cloudflare R2 for full payload archives
- Cron Triggers for daily retention enforcement

## Quick start

```bash
pnpm install
wrangler d1 create kumogakure          # capture the database_id, paste into wrangler.jsonc
wrangler d1 migrations apply kumogakure
wrangler deploy
```

After deployment, the Worker is reachable at `kumogakure.<your-subdomain>.workers.dev`.
Send a few probe requests and inspect the `requests` table.

> Note: a `*.workers.dev` deployment is not visible in Certificate
> Transparency logs, so it attracts little opportunistic scanner traffic
> on its own — this is expected. To make the honeypot discoverable by
> CT-monitoring scanners, see the optional custom-domain setup in
> [`docs/DEPLOY.md`](docs/DEPLOY.md#advanced-custom-domain-for-ct-driven-scanner-traffic).

For a step-by-step walkthrough including R2 bucket creation, verification by
`curl`, and troubleshooting, see [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Configuration

`wrangler.jsonc` exposes:

- `BODY_R2_THRESHOLD` (default `8192`) — request body sizes (in bytes) above
  which the headers + body bundle is archived in R2.
- `BODY_READ_LIMIT` (default `65536`) — maximum bytes read from a request
  body before truncation. Bodies above this size are stored up to the
  limit and marked `body_truncated = 1` in D1.
- `RETENTION_DAYS` (default `30`) — how long captured requests are retained
  before the daily Cron deletes them.
- `GC_BATCH_SIZE` (default `1000`) — page size for the retention sweep.
  D1 rows are scanned in batches of this size and R2 deletes are issued
  one array call per batch.

## Layout

```
src/
├── index.ts            Worker entry, Hono routing
├── bait/
│   ├── catalog.ts      Explicit bait paths
│   ├── patterns.ts     Regex bait patterns
│   └── templates/      Response body modules
├── signals/            Exploit signature detection
├── storage/            D1 and R2 adapters
├── fingerprint/        Anti-fingerprinting headers
├── stats/              Cron-triggered daily aggregation (daily_stats)
└── gc/                 Cron-triggered retention cleanup
docs/                   Deployment and policy documentation
migrations/             D1 schema migrations
tests/                  Vitest unit and integration tests
worker-configuration.d.ts  Generated runtime types (committed; regenerate with `pnpm types`)
```

## Documentation

- [`docs/DEPLOY.md`](docs/DEPLOY.md) — full deployment walkthrough from a fresh
  clone, including resource provisioning, schema migrations, verification, and
  troubleshooting.
- [`docs/RESPONSE_TEMPLATE_POLICY.md`](docs/RESPONSE_TEMPLATE_POLICY.md) — the
  rules every response template must follow (fake-data principles, realism
  tiers, canary marker policy). Required reading before contributing a new
  template.

## Development

After `pnpm install`, the following scripts are available:

| Command | What it does |
|---|---|
| `pnpm dev` | Run the Worker locally with `wrangler dev` |
| `pnpm types` | Regenerate `worker-configuration.d.ts` from `wrangler.jsonc` (run after binding or var changes) |
| `pnpm typecheck` | Type-check the project with `tsc --noEmit` |
| `pnpm lint` | Lint and check formatting via Biome |
| `pnpm format` | Apply Biome formatting in place |
| `pnpm test` | Run the Vitest suite once |
| `pnpm test:watch` | Run Vitest in watch mode |
| `pnpm migrations:apply` | Apply the D1 migrations against the remote database |
| `pnpm run reset:data` | Wipe all captured data (R2 objects + D1 rows). Local by default; `-- --remote` for deployed data. See [`docs/DEPLOY.md`](docs/DEPLOY.md) |
| `pnpm run gaps` | List unmatched probe paths (`category=unknown`) to find bait gaps. Deployed data by default; `-- --hours N`, `-- --limit N`, `-- --local`, `-- --dry-run` |

### Adding a new bait path

1. Decide which category fits (or introduce a new one in `src/types.ts`).
2. Add the path to `src/bait/catalog.ts` (or a regex to `src/bait/patterns.ts`)
   with a template name.
3. Create the template module under `src/bait/templates/<name>.ts` exporting a
   `TemplateFn`. Follow [`docs/RESPONSE_TEMPLATE_POLICY.md`](docs/RESPONSE_TEMPLATE_POLICY.md).
4. Register the template in `src/bait/templates/index.ts`.
5. Add a unit test under `tests/unit/templates/<name>.test.ts`.
6. Verify with `pnpm typecheck`, `pnpm lint`, and `pnpm test`.

## License

MIT — see [LICENSE](LICENSE).
