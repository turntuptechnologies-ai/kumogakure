#!/usr/bin/env bash
#
# List unmatched probe paths (bait implementation gaps).
#
# A "gap" is a captured request that matched no catalog entry or
# pattern, i.e. category = 'unknown' (rows that matched but return
# 'not-found' are intentional, not gaps). The bare root '/' is excluded
# as noise. Output is aggregated by (method, path) and carries NO
# source identifiers (only a distinct-source count) so it is safe to
# paste back for triage.
#
# Usage:
#   pnpm run gaps                      # last 24h, DEPLOYED data
#   pnpm run gaps -- --hours 6
#   pnpm run gaps -- --hours 48 --limit 100
#   pnpm run gaps -- --local           # local Miniflare data
#   pnpm run gaps -- --dry-run         # print SQL/target, no call
#
set -euo pipefail

DB_NAME="kumogakure"

TARGET="remote"   # read-only; gaps are only meaningful against prod
HOURS="24"
LIMIT="200"
DRY_RUN="false"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --remote)  TARGET="remote" ;;
    --local)   TARGET="local" ;;
    --dry-run) DRY_RUN="true" ;;
    --hours)   HOURS="${2:-}"; shift ;;
    --limit)   LIMIT="${2:-}"; shift ;;
    --)        ;; # pnpm may forward the argument separator
    *) echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
  shift
done

case "$HOURS" in ''|*[!0-9]*) echo "error: --hours must be a positive integer" >&2; exit 2 ;; esac
case "$LIMIT" in ''|*[!0-9]*) echo "error: --limit must be a positive integer" >&2; exit 2 ;; esac
if [ "$HOURS" -lt 1 ] || [ "$LIMIT" -lt 1 ]; then
  echo "error: --hours and --limit must be >= 1" >&2; exit 2
fi

CUTOFF=$(( $(date +%s) - HOURS * 3600 ))
ENV_FLAG="--remote"
[ "$TARGET" = "local" ] && ENV_FLAG="--local"

SQL="SELECT method, path, COUNT(*) AS hits, COUNT(DISTINCT ip) AS srcs, MAX(ts) AS last_ts \
FROM requests \
WHERE category = 'unknown' AND path != '/' AND ts >= ${CUTOFF} \
GROUP BY method, path \
ORDER BY hits DESC, last_ts DESC \
LIMIT ${LIMIT};"

if [ "$DRY_RUN" = "true" ]; then
  echo "target : ${TARGET}"
  echo "window : last ${HOURS}h (ts >= ${CUTOFF})"
  echo "limit  : ${LIMIT}"
  echo "sql    : ${SQL}"
  exit 0
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "error: jq is required but not installed." >&2
  exit 1
fi

echo "Unmatched probes (category=unknown, path!=/, last ${HOURS}h, ${TARGET}):" >&2

pnpm exec wrangler d1 execute "$DB_NAME" "$ENV_FLAG" --json --command "$SQL" \
  | jq -r '
      [.. | objects | select(has("path") and has("hits"))] as $rows
      | (["HITS","SRCS","LAST_SEEN_UTC","METHOD","PATH"]),
        ($rows[] | [.hits, .srcs, (.last_ts | tonumber | todate), .method, .path])
      | @tsv' \
  | { command -v column >/dev/null 2>&1 && column -t -s "$(printf '\t')" || cat; }
