#!/usr/bin/env bash
#
# Overall traffic trend report (read-only). An on-demand,
# arbitrary-window view over the requests table, complementing the
# cron-persisted daily_stats rollup.
#
# Output carries NO source identifiers (per the standing rule): no
# IP / ASN / AS-name / UA. `srcs` is a distinct-count only; `country`
# (coarse, non-identifying) is kept as a trend axis.
#
# Usage:
#   pnpm run stats                     # last 7d, DEPLOYED data
#   pnpm run stats -- --days 30
#   pnpm run stats -- --days 1 --top 25
#   pnpm run stats -- --local
#   pnpm run stats -- --dry-run        # print SQL/target, no call
#
set -euo pipefail

. "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

DB_NAME="kumogakure"

TARGET="remote"   # read-only; trends are only meaningful against prod
DAYS="7"
TOP="15"
DRY_RUN="false"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --remote)  TARGET="remote" ;;
    --local)   TARGET="local" ;;
    --dry-run) DRY_RUN="true" ;;
    --days)    DAYS="${2:-}"; shift ;;
    --top)     TOP="${2:-}"; shift ;;
    --)        ;;
    *) echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
  shift
done

case "$DAYS" in ''|*[!0-9]*) echo "error: --days must be a positive integer" >&2; exit 2 ;; esac
case "$TOP"  in ''|*[!0-9]*) echo "error: --top must be a positive integer"  >&2; exit 2 ;; esac
if [ "$DAYS" -lt 1 ] || [ "$TOP" -lt 1 ]; then
  echo "error: --days and --top must be >= 1" >&2; exit 2
fi

CUTOFF=$(( $(date +%s) - DAYS * 86400 ))
ENV_FLAG="--remote"
[ "$TARGET" = "local" ] && ENV_FLAG="--local"
W="ts >= ${CUTOFF}"

SQL_SUMMARY="SELECT COUNT(*) AS total, COUNT(DISTINCT ip) AS srcs, COUNT(DISTINCT path) AS paths, SUM(CASE WHEN signals IS NOT NULL THEN 1 ELSE 0 END) AS signal_hits FROM requests WHERE ${W};"
SQL_CAT="SELECT COALESCE(category,'(none)') AS category, COUNT(*) AS hits, ROUND(COUNT(*)*100.0/(SELECT COUNT(*) FROM requests WHERE ${W}),1) AS pct FROM requests WHERE ${W} GROUP BY category ORDER BY hits DESC LIMIT ${TOP};"
SQL_SUBCAT="SELECT subcategory, COUNT(*) AS hits FROM requests WHERE ${W} AND subcategory IS NOT NULL GROUP BY subcategory ORDER BY hits DESC LIMIT ${TOP};"
SQL_PATH="SELECT method, path, COUNT(*) AS hits, COUNT(DISTINCT ip) AS srcs FROM requests WHERE ${W} GROUP BY method, path ORDER BY hits DESC LIMIT ${TOP};"
SQL_SIG="SELECT je.value AS signal, COUNT(*) AS hits FROM requests, json_each(requests.signals) AS je WHERE ${W} AND requests.signals IS NOT NULL GROUP BY je.value ORDER BY hits DESC LIMIT ${TOP};"
SQL_CC="SELECT COALESCE(country,'(none)') AS country, COUNT(*) AS hits FROM requests WHERE ${W} GROUP BY country ORDER BY hits DESC LIMIT ${TOP};"
SQL_DAY="SELECT date(ts,'unixepoch') AS day, COUNT(*) AS hits FROM requests WHERE ${W} GROUP BY day ORDER BY day;"

if [ "$DRY_RUN" = "true" ]; then
  echo "target : ${TARGET}"
  echo "window : last ${DAYS}d (ts >= ${CUTOFF})"
  echo "top    : ${TOP}"
  for q in SUMMARY CAT SUBCAT PATH SIG CC DAY; do
    eval "echo \"-- ${q}: \$SQL_${q}\""
  done
  exit 0
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "error: jq is required but not installed." >&2
  exit 1
fi

pretty() { command -v column >/dev/null 2>&1 && column -t -s "$(printf '\t')" || cat; }

run() { # $1=title  $2=sql  $3=jq selector key  $4=jq header(array)  $5=jq row(array)
  echo
  echo "== $1 (last ${DAYS}d) =="
  d1_json "$DB_NAME" "$ENV_FLAG" "$2" \
    | jq -r --arg k "$3" '
        [.. | objects | select(has($k))] as $r
        | ('"$4"'), ($r[] | '"$5"') | @tsv' \
    | pretty
}

echo "kumogakure traffic report — last ${DAYS}d (${TARGET}, identifiers excluded)"

run "Summary" "$SQL_SUMMARY" total \
  '["TOTAL","SRCS","PATHS","SIGNAL_HITS","SIGNAL_%"]' \
  '[.total,.srcs,.paths,.signal_hits, (if .total>0 then ((.signal_hits*1000/.total|floor)/10) else 0 end)]'
run "Top categories" "$SQL_CAT" category '["CATEGORY","HITS","PCT"]' '[.category,.hits,.pct]'
run "Top subcategories" "$SQL_SUBCAT" subcategory '["SUBCATEGORY","HITS"]' '[.subcategory,.hits]'
run "Top paths" "$SQL_PATH" path '["HITS","SRCS","METHOD","PATH"]' '[.hits,.srcs,.method,.path]'
run "Top signals" "$SQL_SIG" signal '["SIGNAL","HITS"]' '[.signal,.hits]'
run "Top countries" "$SQL_CC" country '["COUNTRY","HITS"]' '[.country,.hits]'
run "Requests per day" "$SQL_DAY" day '["DAY","HITS"]' '[.day,.hits]'
