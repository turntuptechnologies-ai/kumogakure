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

The `pnpm install` step pulls in Hono, Wrangler, Biome, and Vitest.
Workers runtime types are generated locally from `wrangler.jsonc` into
`worker-configuration.d.ts` and committed to the repo — regenerate them
with `pnpm types` whenever you change a binding or var.

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

R2 must be enabled once at the account level before any bucket can be
created. In the Cloudflare Dashboard, open **R2 Object Storage** and
enable / subscribe to the R2 plan. Cloudflare requires a payment method
on file even for the free tier, but the free allowance (10 GB storage,
1M Class A and 10M Class B operations per month) is not billed — only
usage beyond the limits is. Wrangler and the API cannot perform this
activation; skipping it produces the `code: 10042` error (see
Troubleshooting).

Once R2 is enabled:

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

This applies every SQL file under `migrations/` against the remote D1
database. The initial schema in `0001_init.sql` creates the `requests`
and `daily_stats` tables; later migrations extend them.

If you prefer to test locally first, omit `--remote` to apply against the
local Miniflare-backed D1 emulator.

## 7. Deploy the Worker

```bash
pnpm run deploy
```

(`pnpm deploy <directory>` without `run` is a pnpm 10 built-in for
monorepo subpackage deployment, so use the `run` form explicitly here.)

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

Confirm the structured logs are flowing end-to-end by streaming the
Worker output while issuing another `curl`:

```bash
pnpm exec wrangler tail --format pretty
```

Each captured request emits a `"msg":"capture"` JSON line with the id,
path, category, status, and signal list. Errors emit `"msg":"handler_error"`,
and the daily GC run emits `gc_start` / `gc_complete` (or `gc_error` /
`gc_r2_delete_failed` on failure).

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

## Advanced: custom domain for CT-driven scanner traffic

This step is **optional and not part of the default setup.** The
default `*.workers.dev` deployment works fine, but it attracts very
little opportunistic scanner traffic — and the reason is worth
understanding.

`*.workers.dev` is served behind a **wildcard TLS certificate**. The
specific hostname (`kumogakure.<your-subdomain>.workers.dev`) is never
issued its own certificate, so it **never appears in Certificate
Transparency (CT) logs**. A large class of opportunistic scanners and
attackers monitor CT logs in near real time and probe every newly seen
hostname for exposed paths (`.env`, `/wp-login.php`, `/.git/config`,
and so on). Because a workers.dev hostname is never logged, those
CT-driven scanners never discover it. A workers.dev-only deployment can
therefore sit for weeks with almost no traffic — this is expected, not
a misconfiguration.

To make the honeypot discoverable by CT-monitoring scanners, attach a
custom domain you own:

1. The domain must be an **active zone on the same Cloudflare account**.
   Adding a zone is free on the Free plan — point the domain's
   nameservers at Cloudflare and wait for it to go Active.
2. In the dashboard: **Workers & Pages → your Worker → Settings →
   Domains & Routes → Add → Custom Domain**. Enter a hostname such as
   `vpn.example.com` or `admin.example.com`.
3. Cloudflare creates the proxied DNS record and issues a certificate
   for that exact hostname. That certificate **is** logged in CT, so
   CT-monitoring scanners typically begin probing within minutes to a
   few hours.

Notes:

- **Configure this in the dashboard, not in `wrangler.jsonc`.** Keeping
  the operator-specific hostname out of the committed config keeps this
  repository generic and reusable.
- Use a dedicated subdomain on a domain with **no production services**
  — changing nameservers moves all of that domain's DNS to Cloudflare.
  A realistic-looking name (`vpn.`, `admin.`, `dev.`) attracts more
  scanners.
- Ensure WAF / Bot Fight Mode / Security Level are permissive for that
  hostname (see the Troubleshooting entry below), or Cloudflare blocks
  attacker traffic before it reaches the Worker.
- Discovery is **not one-shot**: Cloudflare rotates the certificate
  periodically, and each renewal produces a fresh CT entry that
  re-triggers CT-monitoring scanners. Combined with mass internet
  scanning that re-sweeps known hosts indefinitely, traffic grows over
  time rather than arriving once.

## Resetting captured data

To wipe everything (all R2 payload objects and all D1 rows) — useful
when clearing test traffic from a staging instance:

```bash
pnpm run reset:data -- --remote        # prompts for confirmation
pnpm run reset:data -- --remote --yes  # skip the prompt
```

Without `--remote` it targets the local Miniflare-backed data. The
script deletes R2 objects first (it derives their keys from D1), then
truncates `requests` and `daily_stats`. This is irreversible — there is
no soft delete or backup.

## Troubleshooting

### "Please enable R2 through the Cloudflare Dashboard" (`code: 10042`)

R2 has never been enabled on the account, so `wrangler r2 bucket create`
gets a 403. This is an account-level, one-time activation that only the
dashboard can perform — see step 4. After enabling R2, re-run the bucket
creation command.

If R2 *is* enabled and you still see this, you may be authenticated
against a different Cloudflare account than the one you enabled R2 on.
Check the active account with:

```bash
pnpm exec wrangler whoami
```

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

### `pnpm typecheck` reports `Env` is missing resource-name properties

If type-check fails with errors like:

```
error TS1360: Type '{ DB: D1Database; PAYLOADS: R2Bucket; ... }' does not
satisfy the expected type 'Env'. Type is missing the following properties
from type 'Env': kumogakure_payloads, kumogakure
```

…the locally-checked-out `worker-configuration.d.ts` is stale. A previous
`wrangler types` run against a different `wrangler.jsonc` or wrangler
version left a broken generated file behind. The file is git-tracked and
`git pull` will not overwrite locally-modified files, so the bad state
persists silently across pulls.

Fix:

```bash
git checkout -- worker-configuration.d.ts
pnpm typecheck
```

If `wrangler.jsonc` genuinely changed and the file must be regenerated,
run `pnpm run types` afterwards and commit the result so the next fresh
clone is clean.

## Operational notes

- The Worker is intentionally low-interaction. It records requests but
  never executes attacker-supplied content.
- Captured request bodies and headers are archived in R2 only when the
  body is non-empty or one of the configured exploit signatures fires.
- Request bodies above `BODY_READ_LIMIT` (default 64 KiB) are captured
  only up to the limit and the row is flagged with `body_truncated = 1`
  in D1. Filter on that column when analysing payloads whose true size
  may have exceeded the cap.
- Authentication credentials submitted to the bait login forms are logged
  to D1 along with the rest of the request metadata. Handle the database
  contents accordingly.
