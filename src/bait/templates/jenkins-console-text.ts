import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for Jenkins build console output —
// `/job/<name>/{lastBuild,lastSuccessfulBuild,lastFailedBuild,<n>}/consoleText`
// at any depth. Anonymous read access on a Jenkins instance exposes every
// job's raw log, and build logs routinely echo environment values, registry
// hosts, and deploy targets — the secrets that the credentials plugin failed
// to mask (CWE-532 / CWE-200). Scanners sweep common job names (`prod`,
// `deploy`, `backend`, `test`) for exactly that.
//
// Plain-text log in the shape Jenkins emits. Bound credentials appear masked
// (`****`) as Jenkins really prints them; hosts are `.invalid`. Fully static
// — the job name from the URL is not reflected.

const body = `Started by user admin
Running as SYSTEM
Building in workspace /var/lib/jenkins/workspace/deploy
The recommended git tool is: NONE
using credential git-deploy-key
 > git rev-parse --resolve-git-dir /var/lib/jenkins/workspace/deploy/.git # timeout=10
Fetching changes from the remote Git repository
 > git config remote.origin.url git@git.example.invalid:platform/app.git # timeout=10
Fetching upstream changes from git@git.example.invalid:platform/app.git
 > git fetch --tags --force --progress -- git@git.example.invalid:platform/app.git +refs/heads/*:refs/remotes/origin/* # timeout=10
Checking out Revision 8c1f3e9a7b2d4c6e0f5a1b3d7e9c2a4f6b8d0e1c (refs/remotes/origin/main)
Commit message: "Merge branch 'release/2.8'"
[deploy] $ /bin/sh -xe /tmp/jenkins4172839305621847.sh
+ export REGISTRY_HOST=registry.internal.invalid
+ export DB_HOST=db.example.invalid
+ echo ****
+ docker login -u deploy --password-stdin registry.internal.invalid
Login Succeeded
+ docker build -t registry.internal.invalid/app:8c1f3e9 .
#1 [internal] load build definition from Dockerfile
#1 DONE 0.0s
#8 exporting to image
#8 DONE 4.2s
+ docker push registry.internal.invalid/app:8c1f3e9
The push refers to repository [registry.internal.invalid/app]
8c1f3e9: digest: sha256:4f7a2e9c1b3d5f8a0e6c2b4d7f9a1c3e5b8d0f2a4c6e8b1d3f5a7c9e2b4d6f8a size: 1784
+ ssh -o StrictHostKeyChecking=no deploy@app-01.example.invalid 'cd /srv/app && docker compose pull && docker compose up -d'
Container app-web-1  Started
Finished: SUCCESS
`;

export const jenkinsConsoleText: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
  });
};
