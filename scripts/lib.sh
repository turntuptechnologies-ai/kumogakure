# Shared helpers for the read-only analysis scripts (sourced, not run).
#
# `wrangler ... --json` can interleave non-JSON lines on stdout (CLI
# banner, experimental/deprecation warnings, update notices), which
# breaks a direct `| jq`. These helpers run the wrangler command and
# emit ONLY the first complete JSON value, using a string/escape-aware
# balanced-bracket scan in node (always available in this repo) so any
# banner before or after the JSON is tolerated.
#
# Wrangler's diagnostic output is captured (not silenced) so that
# intermittent failures — Cloudflare API 5xx / rate limits, network
# blips, OAuth refresh hiccups — surface the actual reason instead of
# a generic "auth? wrong --remote/--local? db name?" guess. With
# `--json`, wrangler emits errors as a `{"error": {"text": "..."}}`
# envelope on stdout (not stderr), so we have to look at both.

# Extract the first complete top-level JSON value from stdin.
_JSON_EXTRACT='let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const i=s.search(/[\[{]/);if(i<0)process.exit(3);let d=0,q=false,e=false,st=-1;for(let j=i;j<s.length;j++){const c=s[j];if(q){if(e)e=false;else if(c==="\\")e=true;else if(c==="\"")q=false;continue}if(c==="\"")q=true;else if(c==="["||c==="{"){if(d===0)st=j;d++}else if(c==="]"||c==="}"){d--;if(d===0){process.stdout.write(s.slice(st,j+1));process.exit(0)}}}process.exit(3)})'

# Print captured wrangler diagnostics. Prefers stderr; falls back to
# any `.error.text` carried in the stdout JSON envelope (this is where
# wrangler routes its errors when `--json` is on). All lines are
# prefixed so it's obvious they came from wrangler.
_emit_wrangler_diag() {
  local stderr_file="$1" stdout_str="$2" emitted=""
  if [ -s "$stderr_file" ]; then
    sed 's/^/  wrangler: /' "$stderr_file" >&2
    emitted="y"
  fi
  if [ -n "$stdout_str" ]; then
    # Best-effort extract of `.error.text` (and any nested `cause`)
    # from the stdout JSON envelope; if jq fails or there's no error
    # field, this is a silent no-op.
    local text
    text=$(printf '%s' "$stdout_str" | node -e "$_JSON_EXTRACT" 2>/dev/null \
      | jq -r '[.error.text // empty, .error.cause // empty, .error.notes // empty | (if type=="array" then .[] else . end)] | map(select(. != null and . != "")) | .[]' 2>/dev/null)
    if [ -n "$text" ]; then
      printf '%s\n' "$text" | sed 's/^/  wrangler: /' >&2
      emitted="y"
    fi
  fi
  if [ -z "$emitted" ]; then
    echo "  wrangler: (no diagnostic output captured)" >&2
  fi
}

# d1_json <db> <env_flag> <sql> -> clean JSON on stdout
d1_json() {
  local out err rc
  err=$(mktemp)
  # shellcheck disable=SC2064  # cleanup path is fixed at trap install time
  trap "rm -f '$err'" RETURN
  out=$(pnpm exec wrangler d1 execute "$1" "$2" --json --command "$3" 2>"$err")
  rc=$?
  if [ "$rc" -ne 0 ]; then
    echo "error: 'wrangler d1 execute' failed (exit $rc):" >&2
    _emit_wrangler_diag "$err" "$out"
    return 1
  fi
  printf '%s' "$out" | node -e "$_JSON_EXTRACT" || {
    echo "error: could not parse JSON from wrangler output." >&2
    _emit_wrangler_diag "$err" "$out"
    return 1
  }
}

# d1_info_json <db> <env_flag> -> clean JSON on stdout ('{}' if
# unavailable). `d1 info` is optional / non-fatal for callers, so a
# failure here prints a one-line warning and yields '{}' rather than
# aborting the whole script.
d1_info_json() {
  local out err rc
  err=$(mktemp)
  # shellcheck disable=SC2064
  trap "rm -f '$err'" RETURN
  out=$(pnpm exec wrangler d1 info "$1" "$2" --json 2>"$err")
  rc=$?
  if [ "$rc" -ne 0 ]; then
    echo "warn: 'wrangler d1 info' failed (exit $rc), continuing without it:" >&2
    _emit_wrangler_diag "$err" "$out"
    echo '{}'
    return 0
  fi
  printf '%s' "$out" | node -e "$_JSON_EXTRACT" 2>/dev/null || echo '{}'
}
