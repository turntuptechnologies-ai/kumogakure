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
wrangler d1 create kumogakure          # capture the database_id, paste into wrangler.toml
wrangler d1 migrations apply kumogakure
wrangler deploy
```

After deployment, the Worker is reachable at `kumogakure.<your-subdomain>.workers.dev`.
Send a few probe requests and inspect the `requests` table.

## Configuration

`wrangler.toml` exposes:

- `BODY_R2_THRESHOLD` (default `8192`) — request body sizes (in bytes) above
  which the headers + body bundle is archived in R2.
- `RETENTION_DAYS` (default `30`) — how long captured requests are retained
  before the daily Cron deletes them.

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
└── gc/                 Cron-triggered cleanup
migrations/             D1 schema migrations
tests/                  Vitest unit and integration tests
```

## License

MIT
