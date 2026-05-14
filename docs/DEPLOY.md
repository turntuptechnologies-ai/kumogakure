# Deployment guide

This guide walks through deploying kumogakure to your own Cloudflare account
from a fresh clone. All steps work within the Cloudflare Free Tier.

## What you will end up with

- A Worker reachable at `kumogakure.<your-subdomain>.workers.dev`
- A D1 database storing per-request metadata
- An R2 bucket archiving headers and bodies of requests carrying payloads or
  signals
- A Cron Trigger running daily to enforce the 30-day retention window

## Prerequisites

- A Cloudflare account (the free plan is sufficient)
- Node.js 22 or newer
- pnpm 10 or newer
- Git

Verify the toolchain is present:

```bash
node --version
pnpm --version
git --version
```

## 1. Clone and install dependencies

```bash
git clone https://github.com/<your-fork-or-source>/kumogakure.git
cd kumogakure
pnpm install
```

The `pnpm install` step pulls in Hono, Wrangler, Biome, Vitest, and the
Cloudflare Workers type definitions.

## 2. Authenticate Wrangler

Wrangler talks to the Cloudflare API on your behalf. Authenticate it once
per machine:

```bash
pnpm exec wrangler login
```

A browser window opens to the Cloudflare consent screen. Approve, and
Wrangler stores the OAuth token locally.

## 3. Create the D1 database

```bash
pnpm exec wrangler d1 create kumogakure
```

The command prints output similar to:

```
✅ Successfully created DB 'kumogakure'

[[d1_databases]]
binding = "DB"
database_name = "kumogakure"
database_id = "00000000-0000-0000-0000-000000000000"
```

**Copy the `database_id` value.** You will paste it into `wrangler.jsonc` in
the next step.

## 4. Create the R2 bucket

```bash
pnpm exec wrangler r2 bucket create kumogakure-payloads
```

The bucket name matches the value already set in `wrangler.jsonc`. No
further configuration is needed here.

## 5. Update `wrangler.jsonc`

Open `wrangler.jsonc` and replace the placeholder `database_id`:

```diff
 "d1_databases": [
   {
     "binding": "DB",
     "database_name": "kumogakure",
-    "database_id": "REPLACE_WITH_YOUR_D1_DATABASE_ID",
+    "database_id": "00000000-0000-0000-0000-000000000000",
     "migrations_dir": "migrations"
   }
 ]
```

(Use the value from step 3, not the placeholder shown above.)

Avoid committing this change back upstream — `database_id` is unique to
your account.

## 6. Apply the schema migrations

```bash
pnpm exec wrangler d1 migrations apply kumogakure --remote
```

This runs the SQL in `migrations/0001_init.sql` against the remote D1
database, creating the `requests` and `daily_stats` tables.

If you prefer to test locally first, omit `--remote` to apply against the
local Miniflare-backed D1 emulator.

## 7. Deploy the Worker

```bash
pnpm deploy
```

Wrangler bundles the source, uploads it, and prints the public URL:

```
Published kumogakure (3.42 sec)
  https://kumogakure.<your-subdomain>.workers.dev
Current Deployment ID: ...
```

Take note of the URL; you will use it for verification and as the address
you publicise to attract scanning traffic.

## 8. Verify the deployment

A handful of `curl` requests confirm that the Worker is matching the right
bait categories and writing to D1.

```bash
URL="https://kumogakure.<your-subdomain>.workers.dev"

# Catch-all path — returns the 404 stub
curl -i "$URL/"

# WordPress login bait — returns an HTML login form
curl -i "$URL/wp-login.php"

# WordPress login POST — should still return 200 with an error notice
curl -i -X POST -d "log=admin&pwd=test" "$URL/wp-login.php"

# Spring Actuator probe — returns the default 404 response
curl -i "$URL/actuator/health"
```

Inspect what was captured:

```bash
pnpm exec wrangler d1 execute kumogakure --remote --command \
  "SELECT id, ts, method, path, category, status FROM requests ORDER BY ts DESC LIMIT 10"
```

You should see one row per request, with `category` populated for paths
the bait catalog matches.

## 9. Daily retention

The Cron Trigger defined in `wrangler.jsonc` runs at `0 0 * * *` (00:00
UTC) and deletes records older than `RETENTION_DAYS` (default 30). No
manual setup is needed; the trigger is registered as part of
`wrangler deploy`.

To exercise the cleanup logic without waiting:

```bash
pnpm exec wrangler dev --test-scheduled
```

Then `curl` the local URL with `cf=__scheduled&time=$(date +%s)` to
simulate the trigger firing.

## Troubleshooting

### "Couldn't find a `database_id`" during deploy

`wrangler.jsonc` still contains the placeholder. Re-run step 5.

### "Database is locked" or migration errors

The remote D1 database may already have an incompatible schema from a
previous attempt. Inspect with:

```bash
pnpm exec wrangler d1 execute kumogakure --remote --command \
  "SELECT name FROM sqlite_master WHERE type='table'"
```

If tables exist with the wrong shape, drop them and re-apply the
migration. Be sure you understand the consequences before doing this in
a production deployment.

### Requests do not appear in `requests`

- Check that `pnpm exec wrangler tail` shows the Worker handling the
  request.
- Confirm that the D1 binding name in `wrangler.jsonc` is `DB` (matches
  `src/storage/d1.ts`).
- Verify the Worker has the latest deployment by running
  `pnpm exec wrangler deployments list`.

### Cloudflare WAF or Bot Fight Mode is blocking probes

`*.workers.dev` is not gated by zone-level WAF rules, but if you later
attach a custom hostname, ensure WAF, Bot Fight Mode, and Security Level
are disabled or set to permissive — otherwise Cloudflare will block
attacker traffic before it reaches the Worker.

## Operational notes

- The Worker is intentionally low-interaction. It records requests but
  never executes attacker-supplied content.
- Captured request bodies and headers are archived in R2 only when the
  body is non-empty or one of the configured exploit signatures fires.
- Authentication credentials submitted to the bait login forms are logged
  to D1 along with the rest of the request metadata. Handle the database
  contents accordingly.
