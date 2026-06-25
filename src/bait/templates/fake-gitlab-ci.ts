import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for `.gitlab-ci.yml` — the GitLab CI/CD pipeline config.
// Scanners pull it (CWE-200) to learn the deploy topology: internal
// registry hosts, image names, deploy targets, kube context, and any
// secrets a careless author inlined. Real pipelines reference *masked
// CI/CD variables* (`$CI_REGISTRY_PASSWORD`) rather than literal secrets,
// so a faithful decoy is naturally non-actionable: it discloses the
// plausible pipeline structure scanners want while leaking no usable
// credential. Internal hosts are `.invalid`. Fully static; never reflects
// the request.

const body = `stages:
  - build
  - test
  - deploy

variables:
  IMAGE_TAG: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA
  NODE_ENV: production

build:
  stage: build
  image: node:20-alpine
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/

test:
  stage: test
  image: node:20-alpine
  script:
    - npm run test

deploy:
  stage: deploy
  image: registry.internal.invalid/ci/deploy:latest
  only:
    - main
  script:
    - docker login -u "$CI_REGISTRY_USER" -p "$CI_REGISTRY_PASSWORD" "$CI_REGISTRY"
    - docker build -t "$IMAGE_TAG" .
    - docker push "$IMAGE_TAG"
    - kubectl set image deployment/app app="$IMAGE_TAG"
  environment:
    name: production
    url: https://app.example.invalid
`;

export const fakeGitlabCi: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/x-yaml; charset=UTF-8' },
  });
};
