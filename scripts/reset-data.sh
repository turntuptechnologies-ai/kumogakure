#!/usr/bin/env bash
#
# Wipe all captured data: every object in the R2 payload bucket and all rows
# in the D1 requests/daily_stats tables.
#
# Order matters: the R2 key list is derived from D1, so R2 objects are deleted
# before the D1 rows are dropped.
#
# Usage:
#   pnpm run reset:data                  # LOCAL data, with confirmation
#   pnpm run reset:data -- --remote      # DEPLOYED data, with confirmation
#   pnpm run reset:data -- --remote --yes
#
set -euo pipefail

DB_NAME="kumogakure"
BUCKET="kumogakure-payloads"

TARGET="local"
ASSUME_YES="false"

for arg in "$@"; do
  case "$arg" in
    --remote) TARGET="remote" ;;
    --local)  TARGET="local" ;;
    --yes|-y) ASSUME_YES="true" ;;
    --) ;; # pnpm may forward the argument separator
    *) echo "Unknown argument: $arg" >&2; exit 2 ;;
  esac
done

if [ "$TARGET" = "remote" ]; then
  ENV_FLAG="--remote"
else
  ENV_FLAG="--local"
fi

# --- Preconditions ---------------------------------------------------------
if ! pnpm exec wrangler --version >/dev/null 2>&1; then
  echo "error: wrangler is not available (run 'pnpm install' first)." >&2
  exit 1
fi
if ! command -v jq >/dev/null 2>&1; then
  echo "error: jq is required but not installed." >&2
  exit 1
fi

# --- Confirmation ----------------------------------------------------------
echo "About to PERMANENTLY delete ALL captured data:"
echo "  D1 database : ${DB_NAME} (${TARGET})"
echo "  R2 bucket   : ${BUCKET} (${TARGET})"
echo "  Tables      : requests, daily_stats"
echo "This cannot be undone."

if [ "$ASSUME_YES" != "true" ]; then
  printf 'Type "yes" to proceed: '
  read -r reply
  if [ "$reply" != "yes" ]; then
    echo "Aborted."
    exit 0
  fi
fi

# --- 1. Collect R2 keys from D1 -------------------------------------------
echo "Collecting R2 keys from D1..."
keys="$(
  pnpm exec wrangler d1 execute "$DB_NAME" "$ENV_FLAG" --json \
    --command "SELECT r2_key FROM requests WHERE r2_key IS NOT NULL" \
    | jq -r '.. | objects | .r2_key? | select(. != null and . != "")'
)"

# --- 2. Delete R2 objects --------------------------------------------------
if [ -z "$keys" ]; then
  echo "No R2 objects to delete."
else
  count="$(printf '%s\n' "$keys" | wc -l | tr -d ' ')"
  echo "Deleting ${count} R2 object(s)..."
  while IFS= read -r key; do
    [ -z "$key" ] && continue
    pnpm exec wrangler r2 object delete "${BUCKET}/${key}" "$ENV_FLAG"
  done <<< "$keys"
fi

# --- 3. Clear D1 tables ----------------------------------------------------
echo "Clearing D1 tables..."
pnpm exec wrangler d1 execute "$DB_NAME" "$ENV_FLAG" \
  --command "DELETE FROM requests; DELETE FROM daily_stats"

echo "Done. ${DB_NAME} (${TARGET}) and ${BUCKET} are now empty."
