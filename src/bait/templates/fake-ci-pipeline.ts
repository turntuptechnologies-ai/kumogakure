import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for the YAML CI/CD pipeline definitions that scanners sweep
// alongside `.gitlab-ci.yml` and `.github/workflows/*` — Travis CI, CircleCI,
// Drone, Bitbucket Pipelines, Buildkite, and Azure Pipelines. Same CWE-200
// class as the two existing CI decoys: the pipeline discloses deploy
// topology (internal registry hosts, image names, deploy targets, branch
// gating) and is the file a careless author inlines a secret into.
//
// Each product has its own top-level schema, and a scanner's parser keys on
// that schema, so serving one generic YAML shape for all six would read
// wrong. `TemplateContext` carries the matched `subcategory`, so this module
// selects the product-correct document from a fixed lookup — the branch is on
// our own classification constant, never on attacker-controlled input.
//
// Every pipeline references secrets the way a real one does: through the
// product's masked-variable mechanism (`$DOCKER_PASSWORD`, `$(registryPass)`,
// `from_secret`), so no usable credential is disclosed. Hosts are `.invalid`.

const travis = `language: node_js
node_js:
  - "20"

cache:
  directories:
    - node_modules

env:
  global:
    - NODE_ENV=production
    - REGISTRY_HOST=registry.internal.invalid

install:
  - npm ci

script:
  - npm run lint
  - npm run test

deploy:
  provider: script
  script: >-
    docker login -u "$DOCKER_USERNAME" -p "$DOCKER_PASSWORD" "$REGISTRY_HOST" &&
    docker build -t "$REGISTRY_HOST/app:$TRAVIS_COMMIT" . &&
    docker push "$REGISTRY_HOST/app:$TRAVIS_COMMIT"
  skip_cleanup: true
  on:
    branch: main
`;

const circleci = `version: 2.1

orbs:
  node: circleci/node@5.2.0

jobs:
  build:
    docker:
      - image: cimg/node:20.11
    steps:
      - checkout
      - node/install-packages
      - run:
          name: Lint
          command: npm run lint
      - run:
          name: Test
          command: npm run test

  deploy:
    docker:
      - image: cimg/base:2024.02
    environment:
      REGISTRY_HOST: registry.internal.invalid
    steps:
      - checkout
      - setup_remote_docker
      - run:
          name: Push image
          command: |
            echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin "$REGISTRY_HOST"
            docker build -t "$REGISTRY_HOST/app:$CIRCLE_SHA1" .
            docker push "$REGISTRY_HOST/app:$CIRCLE_SHA1"

workflows:
  build-and-deploy:
    jobs:
      - build:
          context: org-global
      - deploy:
          context: org-global
          requires:
            - build
          filters:
            branches:
              only: main
`;

const drone = `kind: pipeline
type: docker
name: default

steps:
  - name: install
    image: node:20-alpine
    commands:
      - npm ci

  - name: test
    image: node:20-alpine
    commands:
      - npm run lint
      - npm run test

  - name: publish
    image: plugins/docker
    settings:
      registry: registry.internal.invalid
      repo: registry.internal.invalid/app
      tags:
        - latest
        - \${DRONE_COMMIT_SHA:0:8}
      username:
        from_secret: docker_username
      password:
        from_secret: docker_password
    when:
      branch:
        - main

trigger:
  event:
    - push
    - pull_request
`;

const bitbucket = `image: node:20

definitions:
  caches:
    npm: ~/.npm

pipelines:
  default:
    - step:
        name: Build and test
        caches:
          - npm
        script:
          - npm ci
          - npm run lint
          - npm run test

  branches:
    main:
      - step:
          name: Build and test
          script:
            - npm ci
            - npm run test
      - step:
          name: Deploy to production
          deployment: production
          services:
            - docker
          script:
            - echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin registry.internal.invalid
            - docker build -t registry.internal.invalid/app:$BITBUCKET_COMMIT .
            - docker push registry.internal.invalid/app:$BITBUCKET_COMMIT
`;

const buildkite = `env:
  REGISTRY_HOST: registry.internal.invalid
  NODE_ENV: production

steps:
  - label: ":eslint: Lint"
    command: npm ci && npm run lint
    plugins:
      - docker#v5.10.0:
          image: node:20-alpine

  - label: ":vitest: Test"
    command: npm run test
    plugins:
      - docker#v5.10.0:
          image: node:20-alpine

  - wait

  - label: ":docker: Publish"
    branches: main
    command: .buildkite/publish.sh
    plugins:
      - docker-login#v2.1.0:
          username: ci-publisher
          password-env: DOCKER_PASSWORD
          server: registry.internal.invalid
    agents:
      queue: deploy
`;

const azure = `trigger:
  branches:
    include:
      - main

pool:
  vmImage: ubuntu-latest

variables:
  - group: production-secrets
  - name: registryHost
    value: registry.internal.invalid
  - name: nodeVersion
    value: "20.x"

stages:
  - stage: Build
    jobs:
      - job: BuildAndTest
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: $(nodeVersion)
          - script: npm ci
            displayName: Install
          - script: npm run lint && npm run test
            displayName: Lint and test

  - stage: Deploy
    dependsOn: Build
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
    jobs:
      - deployment: Publish
        environment: production
        strategy:
          runOnce:
            deploy:
              steps:
                - script: |
                    echo "$(registryPassword)" | docker login -u "$(registryUser)" --password-stdin $(registryHost)
                    docker build -t $(registryHost)/app:$(Build.SourceVersion) .
                    docker push $(registryHost)/app:$(Build.SourceVersion)
                  displayName: Build and push image
`;

const bySubcategory: Record<string, string> = {
  'travis-ci': travis,
  circleci,
  'drone-ci': drone,
  'bitbucket-pipelines': bitbucket,
  buildkite,
  'azure-pipelines': azure,
};

export const fakeCiPipeline: TemplateFn = ({ subcategory }) => {
  // Falls back to the Travis document if the subcategory is somehow absent;
  // any format-valid pipeline is a better answer than an empty body.
  const body = (subcategory && bySubcategory[subcategory]) ?? travis;
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/x-yaml; charset=UTF-8' },
  });
};
