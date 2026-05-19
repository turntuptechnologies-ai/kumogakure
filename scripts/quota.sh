#!/usr/bin/env bash
#
# Estimate how much of the Cloudflare Free Tier is in use (read-only).
#
# Zero-setup: no extra credentials, wrangler only (like gaps/stats).
# Most figures are ESTIMATES derived from our own D1 data and are
# marked "(est)". D1 storage is exact (wrangler d1 info). Dimensions
# that cannot be derived from D1 (D1 rows-read/day, exact R2 bytes)
# are reported as "n/a — see dashboard" rather than guessed.
#
# Free-tier limits — verified 2026-05; update the constants below if
# Cloudflare changes them:
#   Workers : 100,000 requests/day        https://developers.cloudflare.com/workers/platform/pricing/
#   D1      : 5 GB storage, 100,000 rows  https://developers.cloudflare.com/d1/platform/limits/
#             written/day (5M read/day)
#   R2      : 10 GB-month, 1,000,000      https://developers.cloudflare.com/r2/pricing/
#             Class A/month, 10M Class B/month
#
# Usage:
#   pnpm run quota                  # DEPLOYED data
#   pnpm run quota -- --days 30     # R2 month-window override (default 30)
#   pnpm run quota -- --local
#   pnpm run quota -- --dry-run
#
set -euo pipefail

. "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

DB_NAME="kumogakure"

LIMIT_WORKERS_REQ_DAY=100000
LIMIT_D1_WRITES_DAY=100000
LIMIT_D1_STORAGE_BYTES=5000000000      # 5 GB (decimal)
LIMIT_R2_CLASS_A_MONTH=1000000

TARGET="remote"   # read-only; usage is only meaningful against prod
MONTH_DAYS="30"
DRY_RUN="false"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --remote)  TARGET="remote" ;;
    --local)   TARGET="local" ;;
    --dry-run) DRY_RUN="true" ;;
    --days)    MONTH_DAYS="${2:-}"; shift ;;
    --)        ;;
    *) echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
  shift
done

case "$MONTH_DAYS" in ''|*[!0-9]*) echo "error: --days must be a positive integer" >&2; exit 2 ;; esac
[ "$MONTH_DAYS" -lt 1 ] && { echo "error: --days must be >= 1" >&2; exit 2; }

NOW=$(date +%s)
DAY_START=$(( NOW / 86400 * 86400 ))          # last UTC midnight (Cloudflare daily reset)
MONTH_START=$(( NOW - MONTH_DAYS * 86400 ))   # rolling N-day window for R2 month estimate

ENV_FLAG="--remote"
[ "$TARGET" = "local" ] && ENV_FLAG="--local"

SQL="SELECT \
(SELECT COUNT(*) FROM requests WHERE ts >= ${DAY_START}) AS req_day, \
(SELECT COUNT(*) FROM requests WHERE ts >= ${MONTH_START} AND r2_key IS NOT NULL) AS r2_class_a_month;"

if [ "$DRY_RUN" = "true" ]; then
  echo "target      : ${TARGET}"
  echo "day window  : ts >= ${DAY_START} (UTC midnight)"
  echo "month window: ts >= ${MONTH_START} (rolling ${MONTH_DAYS}d)"
  echo "counts sql  : ${SQL}"
  echo "storage     : wrangler d1 info ${DB_NAME} ${ENV_FLAG} --json (.file_size)"
  exit 0
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "error: jq is required but not installed." >&2
  exit 1
fi

COUNTS_JSON=$(d1_json "$DB_NAME" "$ENV_FLAG" "$SQL")
REQ_DAY=$(printf '%s' "$COUNTS_JSON" | jq -r 'first(.. | objects | select(has("req_day")) | .req_day)')
R2_A_MONTH=$(printf '%s' "$COUNTS_JSON" | jq -r 'first(.. | objects | select(has("r2_class_a_month")) | .r2_class_a_month)')

D1_INFO_JSON=$(d1_info_json "$DB_NAME" "$ENV_FLAG")
D1_BYTES=$(printf '%s' "$D1_INFO_JSON" | jq -r 'first(.. | objects | (.file_size // .database_size) // empty) // 0')
[ -z "$D1_BYTES" ] && D1_BYTES=0

echo "kumogakure free-tier usage — ${TARGET} (estimates marked est; limits verified 2026-05)"
echo

awk -v reqd="$REQ_DAY" -v r2a="$R2_A_MONTH" -v d1b="$D1_BYTES" \
    -v Lreq="$LIMIT_WORKERS_REQ_DAY" -v Lwr="$LIMIT_D1_WRITES_DAY" \
    -v Lst="$LIMIT_D1_STORAGE_BYTES" -v Lr2="$LIMIT_R2_CLASS_A_MONTH" \
    -v md="$MONTH_DAYS" '
function pct(u,l){ return l>0 ? sprintf("%.1f%%", u*100.0/l) : "-" }
BEGIN {
  fmt="%-26s %14s %16s %7s  %s\n";
  printf fmt,"RESOURCE","USED","LIMIT","PCT","WINDOW";
  printf fmt,"--------","----","-----","---","------";
  p1=reqd*100.0/Lreq; p2=reqd*100.0/Lwr; p3=d1b*100.0/Lst; p4=r2a*100.0/Lr2;
  printf fmt,"Workers requests/day (est)",reqd,Lreq,pct(reqd,Lreq),"today UTC";
  printf fmt,"D1 rows written/day (est)",reqd,Lwr,pct(reqd,Lwr),"today UTC";
  printf fmt,"D1 storage",d1b" B",Lst" B",pct(d1b,Lst),"current";
  printf fmt,"R2 Class A/month (est)",r2a,Lr2,pct(r2a,Lr2),"rolling "md"d";
  printf fmt,"D1 rows read/day","n/a","5,000,000","-","see dashboard";
  printf fmt,"R2 storage bytes","n/a","10 GB-month","-","see dashboard";
  peak=p1; res="Workers requests/day";
  if(p2>peak){peak=p2;res="D1 rows written/day"}
  if(p3>peak){peak=p3;res="D1 storage"}
  if(p4>peak){peak=p4;res="R2 Class A/month"}
  printf "\npeak ~%.1f%% (binding: %s)\n", peak, res;
  print "note: per-day = since UTC midnight (matches Cloudflare reset); R2 month is a rolling estimate. Exact figures: Cloudflare dashboard.";
}'
