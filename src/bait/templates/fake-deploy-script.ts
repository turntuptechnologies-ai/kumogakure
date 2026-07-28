import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for a served deploy/release shell script — `deploy.sh` and the
// sibling names scanners try (`release.sh`, `publish.sh`, `entrypoint.sh`, …).
// The highest-value member of the repo-artifact family after the CI configs:
// a deploy script names the target hosts, the SSH key path, the rsync layout,
// the registry, and the post-deploy commands, and it is the file where a
// password most often ends up hardcoded rather than referenced (CWE-200 /
// CWE-798).
//
// This decoy models the disciplined version — secrets read from the
// environment with `${VAR:?}` guards — so it discloses the deploy topology a
// scanner is after while leaking nothing usable. Hosts are `.invalid`; the
// `set -euo pipefail` preamble and trap make it read as a real script rather
// than a snippet. Fully static; never reflects the request.

const body = `#!/usr/bin/env bash
#
# Deploy the application to production.
#
#   ./deploy.sh [--skip-migrations]
#
# Requires: DEPLOY_SSH_KEY, REGISTRY_PASSWORD, DB_PASSWORD in the environment
# (sourced from the ops vault, never committed).

set -euo pipefail
IFS=$'\\n\\t'

APP_NAME="app"
REGISTRY="registry.internal.invalid"
IMAGE="\${REGISTRY}/\${APP_NAME}"
DEPLOY_USER="deploy"
DEPLOY_HOSTS=("app-01.internal.invalid" "app-02.internal.invalid")
DEPLOY_PATH="/srv/www/\${APP_NAME}"
RELEASE="$(date -u +%Y%m%d%H%M%S)"
SSH_KEY="\${DEPLOY_SSH_KEY:?DEPLOY_SSH_KEY is not set}"
REGISTRY_USER="ci-publisher"
REGISTRY_PASSWORD="\${REGISTRY_PASSWORD:?REGISTRY_PASSWORD is not set}"
DB_HOST="db.internal.invalid"
DB_NAME="app_production"
DB_USER="app_user"
DB_PASSWORD="\${DB_PASSWORD:?DB_PASSWORD is not set}"
SLACK_WEBHOOK="\${SLACK_WEBHOOK:-}"

log() { printf '[%s] %s\\n' "$(date -u +%H:%M:%S)" "$*" >&2; }
fail() { log "FAILED: $*"; exit 1; }
trap 'fail "aborted on line $LINENO"' ERR

log "Building \${IMAGE}:\${RELEASE}"
npm ci --omit=dev
npm run build
docker build -t "\${IMAGE}:\${RELEASE}" -t "\${IMAGE}:latest" .

log "Pushing to \${REGISTRY}"
echo "\${REGISTRY_PASSWORD}" | docker login -u "\${REGISTRY_USER}" --password-stdin "\${REGISTRY}"
docker push "\${IMAGE}:\${RELEASE}"
docker push "\${IMAGE}:latest"

if [[ "\${1:-}" != "--skip-migrations" ]]; then
  log "Applying migrations"
  PGPASSWORD="\${DB_PASSWORD}" psql \\
    --host="\${DB_HOST}" --username="\${DB_USER}" --dbname="\${DB_NAME}" \\
    --set ON_ERROR_STOP=1 --file=migrations/latest.sql
fi

for host in "\${DEPLOY_HOSTS[@]}"; do
  log "Deploying to \${host}"
  rsync -az --delete -e "ssh -i \${SSH_KEY} -o StrictHostKeyChecking=yes" \\
    dist/ "\${DEPLOY_USER}@\${host}:\${DEPLOY_PATH}/releases/\${RELEASE}/"
  ssh -i "\${SSH_KEY}" "\${DEPLOY_USER}@\${host}" bash -s <<EOF
    set -euo pipefail
    ln -sfn "\${DEPLOY_PATH}/releases/\${RELEASE}" "\${DEPLOY_PATH}/current"
    docker compose --project-directory "\${DEPLOY_PATH}/current" pull
    docker compose --project-directory "\${DEPLOY_PATH}/current" up -d --remove-orphans
    sudo systemctl reload nginx
EOF
done

log "Verifying health"
for host in "\${DEPLOY_HOSTS[@]}"; do
  curl -fsS --max-time 10 "https://\${host}/healthz" >/dev/null || fail "\${host} unhealthy"
done

if [[ -n "\${SLACK_WEBHOOK}" ]]; then
  curl -fsS -X POST -H 'Content-Type: application/json' \\
    -d "{\\"text\\":\\"Deployed \${APP_NAME} \${RELEASE}\\"}" "\${SLACK_WEBHOOK}" >/dev/null
fi

log "Deployed \${RELEASE}"
`;

export const fakeDeployScript: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/x-shellscript; charset=UTF-8' },
  });
};
