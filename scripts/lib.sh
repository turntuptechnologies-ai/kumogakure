# Shared helpers for the read-only analysis scripts (sourced, not run).
#
# `wrangler ... --json` can interleave non-JSON lines on stdout (CLI
# banner, experimental/deprecation warnings, update notices), which
# breaks a direct `| jq`. These helpers run the wrangler command and
# emit ONLY the first complete JSON value, using a string/escape-aware
# balanced-bracket scan in node (always available in this repo) so any
# banner before or after the JSON is tolerated.

# Extract the first complete top-level JSON value from stdin.
_JSON_EXTRACT='let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const i=s.search(/[\[{]/);if(i<0)process.exit(3);let d=0,q=false,e=false,st=-1;for(let j=i;j<s.length;j++){const c=s[j];if(q){if(e)e=false;else if(c==="\\")e=true;else if(c==="\"")q=false;continue}if(c==="\"")q=true;else if(c==="["||c==="{"){if(d===0)st=j;d++}else if(c==="]"||c==="}"){d--;if(d===0){process.stdout.write(s.slice(st,j+1));process.exit(0)}}}process.exit(3)})'

# d1_json <db> <env_flag> <sql> -> clean JSON on stdout
d1_json() {
  local out
  out=$(pnpm exec wrangler d1 execute "$1" "$2" --json --command "$3" 2>/dev/null) || {
    echo "error: 'wrangler d1 execute' failed (auth? wrong --remote/--local? db name?)" >&2
    return 1
  }
  printf '%s' "$out" | node -e "$_JSON_EXTRACT" || {
    echo "error: could not parse JSON from wrangler output." >&2
    return 1
  }
}

# d1_info_json <db> <env_flag> -> clean JSON on stdout ('{}' if unavailable)
d1_info_json() {
  local out
  out=$(pnpm exec wrangler d1 info "$1" "$2" --json 2>/dev/null) || { echo '{}'; return 0; }
  printf '%s' "$out" | node -e "$_JSON_EXTRACT" 2>/dev/null || echo '{}'
}
