import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for GitHub Actions workflow definitions under
// `.github/workflows/`. The GitHub sibling of the `.gitlab-ci.yml` decoy and
// the same CWE-200 class: pulling the workflow gives a scanner the deploy
// topology — registry hosts, image names, environment names, rollout target —
// plus any credential an author inlined instead of referencing through
// `secrets.*`.
//
// As with the GitLab decoy, a faithful workflow is naturally non-actionable:
// real ones reference `${{ secrets.NAME }}`, so the decoy discloses the
// structure scanners want while leaking no usable credential. Internal hosts
// are `.invalid`. Fully static; never reflects the request.
//
// `${{` is escaped below because this is a JS template literal.

const body = `name: deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  REGISTRY: registry.internal.invalid
  IMAGE_NAME: platform/api
  NODE_VERSION: '20'

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://app.example.invalid
    steps:
      - uses: actions/checkout@v4
      - name: Log in to the internal registry
        run: |
          echo "\${{ secrets.REGISTRY_PASSWORD }}" \\
            | docker login "$REGISTRY" -u "\${{ secrets.REGISTRY_USERNAME }}" --password-stdin
      - name: Build and push the image
        run: |
          docker build -t "$REGISTRY/$IMAGE_NAME:\${{ github.sha }}" .
          docker push "$REGISTRY/$IMAGE_NAME:\${{ github.sha }}"
      - name: Roll out to the cluster
        env:
          KUBECONFIG_DATA: \${{ secrets.KUBECONFIG_DATA }}
        run: |
          mkdir -p "$HOME/.kube"
          echo "$KUBECONFIG_DATA" | base64 -d > "$HOME/.kube/config"
          kubectl --namespace platform set image deployment/api \\
            api="$REGISTRY/$IMAGE_NAME:\${{ github.sha }}"
          kubectl --namespace platform rollout status deployment/api
      - name: Notify
        if: always()
        run: |
          curl -sS -X POST "\${{ secrets.NOTIFY_WEBHOOK_URL }}" \\
            -H 'content-type: application/json' \\
            -d "{\\"status\\":\\"\${{ job.status }}\\",\\"sha\\":\\"\${{ github.sha }}\\"}"
`;

export const fakeGithubWorkflow: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/x-yaml; charset=UTF-8' },
  });
};
