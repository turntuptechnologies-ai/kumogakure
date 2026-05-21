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
#   pnpm run gaps                          # last 24h, DEPLOYED data
#   pnpm run gaps -- --hours 6
#   pnpm run gaps -- --hours 48 --limit 100
#   pnpm run gaps -- --local               # local Miniflare data
#   pnpm run gaps -- --dry-run             # print SQL/target, no call
#   pnpm run gaps -- --with-body           # also fetch & inline R2 bodies
#                                          # (filter switches to bodied
#                                          #  unknowns; path='/' kept)
#   pnpm run gaps -- --with-body --max-body 8192
#
set -euo pipefail

. "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

DB_NAME="kumogakure"
BUCKET="kumogakure-payloads"

TARGET="remote"   # read-only; gaps are only meaningful against prod
HOURS="24"
LIMIT="200"
LIMIT_SET="false"
WITH_BODY="false"
MAX_BODY="4096"
DRY_RUN="false"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --remote)    TARGET="remote" ;;
    --local)     TARGET="local" ;;
    --dry-run)   DRY_RUN="true" ;;
    --with-body) WITH_BODY="true" ;;
    --hours)     HOURS="${2:-}"; shift ;;
    --limit)     LIMIT="${2:-}"; LIMIT_SET="true"; shift ;;
    --max-body)  MAX_BODY="${2:-}"; shift ;;
    --)          ;; # pnpm may forward the argument separator
    *) echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
  shift
done

# Cap R2 fetches when --with-body unless the user explicitly raised the
# limit (each row costs an R2 GET round-trip).
if [ "$WITH_BODY" = "true" ] && [ "$LIMIT_SET" = "false" ]; then
  LIMIT="20"
fi

case "$HOURS"    in ''|*[!0-9]*) echo "error: --hours must be a positive integer" >&2;    exit 2 ;; esac
case "$LIMIT"    in ''|*[!0-9]*) echo "error: --limit must be a positive integer" >&2;    exit 2 ;; esac
case "$MAX_BODY" in ''|*[!0-9]*) echo "error: --max-body must be a positive integer" >&2; exit 2 ;; esac
if [ "$HOURS" -lt 1 ] || [ "$LIMIT" -lt 1 ] || [ "$MAX_BODY" -lt 1 ]; then
  echo "error: --hours, --limit, --max-body must be >= 1" >&2; exit 2
fi

CUTOFF=$(( $(date +%s) - HOURS * 3600 ))
ENV_FLAG="--remote"
[ "$TARGET" = "local" ] && ENV_FLAG="--local"

if [ "$WITH_BODY" = "true" ]; then
  # Bodied-unknown subset: a bodied request to '/' is exactly interesting
  # (e.g., Next.js Server Action probes), so the path='/' exclusion is
  # dropped. ONE ROW PER REQUEST — distinct bodies on the same path
  # must each be shown (no GROUP BY), so every payload variant is
  # inspectable.
  SQL="SELECT ts, method, path, r2_key \
FROM requests \
WHERE category = 'unknown' AND r2_key IS NOT NULL AND ts >= ${CUTOFF} \
ORDER BY ts DESC \
LIMIT ${LIMIT};"
else
  SQL="SELECT method, path, COUNT(*) AS hits, COUNT(DISTINCT ip) AS srcs, MAX(ts) AS last_ts \
FROM requests \
WHERE category = 'unknown' AND path != '/' AND ts >= ${CUTOFF} \
GROUP BY method, path \
ORDER BY hits DESC, last_ts DESC \
LIMIT ${LIMIT};"
fi

if [ "$DRY_RUN" = "true" ]; then
  echo "target    : ${TARGET}"
  echo "window    : last ${HOURS}h (ts >= ${CUTOFF})"
  echo "limit     : ${LIMIT}"
  echo "with-body : ${WITH_BODY} (max-body ${MAX_BODY})"
  echo "sql       : ${SQL}"
  [ "$WITH_BODY" = "true" ] && echo "fetch     : wrangler r2 object get ${BUCKET}/<r2_key> ${ENV_FLAG} --file <tmp> | gunzip"
  exit 0
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "error: jq is required but not installed." >&2
  exit 1
fi

if [ "$WITH_BODY" = "true" ]; then
  echo "Unmatched probes WITH BODY (category=unknown AND r2_key, last ${HOURS}h, ${TARGET}):" >&2
else
  echo "Unmatched probes (category=unknown, path!=/, last ${HOURS}h, ${TARGET}):" >&2
fi

RESULT=$(d1_json "$DB_NAME" "$ENV_FLAG" "$SQL")

if [ "$WITH_BODY" = "false" ]; then
  printf '%s' "$RESULT" \
    | jq -r '
        [.. | objects | select(has("path") and has("hits"))] as $rows
        | (["HITS","SRCS","LAST_SEEN_UTC","METHOD","PATH"]),
          ($rows[] | [.hits, .srcs, (.last_ts | tonumber | todate), .method, .path])
        | @tsv' \
    | { command -v column >/dev/null 2>&1 && column -t -s "$(printf '\t')" || cat; }
fi

if [ "$WITH_BODY" = "true" ]; then
  # Fetch each R2 payload once, save to a per-row file, then render both
  # the table (with a single-line BODY preview to the right of R2_KEY)
  # and the per-entry blocks below (full body up to --max-body).
  WORK=$(mktemp -d)
  trap 'rm -rf "$WORK"' EXIT
  PREVIEW_LEN=200   # single-line preview width in the BODY column

  printf '%s' "$RESULT" \
    | jq -r '
        [.. | objects | select(has("r2_key") and (.r2_key != null))]
        | to_entries[]
        | "\(.key+1)\t\(.value.ts)\t\(.value.method)\t\(.value.path)\t\(.value.r2_key)"' \
      > "$WORK/rows.tsv"

  while IFS=$'\t' read -r idx ts method path key; do
    [ -z "$idx" ] && continue
    obj="$WORK/$idx.obj"
    out="$WORK/$idx.body"
    : > "$out"
    if pnpm exec wrangler r2 object get "${BUCKET}/${key}" "$ENV_FLAG" --file "$obj" >/dev/null 2>&1; then
      # Some wrangler versions auto-decode Content-Encoding: gzip on
      # --file write; others pass raw bytes. Try gunzip first, then
      # fall back to the file as-is when it is non-empty.
      if gunzip -c "$obj" > "$out" 2>/dev/null && [ -s "$out" ]; then
        :
      elif [ -s "$obj" ]; then
        cp "$obj" "$out"
      fi
    fi
    printf '%s\t%s\t%s\t%s\t%s\n' "$idx" "$ts" "$method" "$path" "$key" >> "$WORK/meta.tsv"
  done < "$WORK/rows.tsv"

  # Table with BODY preview to the right of R2_KEY.
  {
    printf 'TS_UTC\tMETHOD\tPATH\tR2_KEY\tBODY\n'
    while IFS=$'\t' read -r idx ts method path key; do
      ts_iso=$(date -u -d "@${ts}" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || echo "${ts}")
      if [ -s "$WORK/$idx.body" ]; then
        # Prefer the bundle's `.body` field (the actual request body) over
        # the full {headers, body} JSON, which would otherwise consume the
        # preview width with header metadata. Falls back to the raw file
        # contents if the bundle is unparseable or has no `body` key. The
        # per-entry block below still shows the full bundle, so any
        # attack signal carried in headers remains inspectable there.
        if jq -e 'type == "object" and has("body")' < "$WORK/$idx.body" >/dev/null 2>&1; then
          src=$(jq -r '.body // ""' < "$WORK/$idx.body")
        else
          src=$(cat "$WORK/$idx.body")
        fi
        preview=$(printf '%s' "$src" | tr '\r\n\t' '   ' | cut -c"1-${PREVIEW_LEN}")
        if [ "${#src}" -gt "$PREVIEW_LEN" ]; then preview="${preview}…"; fi
        [ -z "$preview" ] && preview="(empty body)"
      else
        preview="[r2 fetch returned empty or failed]"
      fi
      printf '%s\t%s\t%s\t%s\t%s\n' "$ts_iso" "$method" "$path" "$key" "$preview"
    done < "$WORK/meta.tsv"
  } | { command -v column >/dev/null 2>&1 && column -t -s "$(printf '\t')" 2>/dev/null || cat; }

  # Per-entry blocks: full body (up to --max-body) preserving newlines.
  while IFS=$'\t' read -r idx ts method path key; do
    ts_iso=$(date -u -d "@${ts}" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || echo "${ts}")
    echo
    echo "─── #${idx}  ts=${ts_iso}  method=${method}  path=${path} ───"
    echo "r2_key: ${key}"
    if [ -s "$WORK/$idx.body" ]; then
      body=$(cat "$WORK/$idx.body")
      if [ "${#body}" -gt "$MAX_BODY" ]; then
        printf '%s' "${body:0:$MAX_BODY}"
        printf '\n... [truncated, %d more chars]\n' "$(( ${#body} - MAX_BODY ))"
      else
        printf '%s\n' "$body"
      fi
    else
      echo "[r2 fetch returned empty or failed]"
    fi
  done < "$WORK/meta.tsv"
fi
