import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for a served `Makefile` (CWE-200). Swept alongside the CI
// configs as part of the same "the repo is being served as static files"
// hypothesis. A project Makefile is a deploy-topology disclosure: the target
// list maps the release process, and the variable block names the registry,
// the SSH deploy host, and the database the migration target talks to.
//
// Secrets are referenced the way a real Makefile does — through the
// environment (`$(DB_PASSWORD)`, `?=` defaults) rather than as literals — so
// the decoy leaks structure, not credentials. Hosts are `.invalid`. Note the
// body must keep real tab indentation: `make` rejects space-indented recipe
// lines, and a scanner that pipes this to `make -n` would notice.

const body = `SHELL := /bin/bash
.DEFAULT_GOAL := help

APP          ?= app
REGISTRY     ?= registry.internal.invalid
IMAGE        ?= $(REGISTRY)/$(APP)
REVISION     := $(shell git rev-parse --short HEAD 2>/dev/null || echo dev)
DEPLOY_HOST  ?= deploy@app-01.internal.invalid
DEPLOY_PATH  ?= /srv/www/$(APP)
SSH_KEY      ?= ~/.ssh/id_ed25519_deploy
DB_HOST      ?= db.internal.invalid
DB_NAME      ?= app_production
DB_USER      ?= app_user
DB_PASSWORD  ?= $(shell echo "$$APP_DB_PASSWORD")

.PHONY: help install build test lint image push deploy migrate backup clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk -F':.*?## ' '{printf "  %-10s %s\\n", $$1, $$2}'

install: ## Install dependencies
	npm ci

build: install ## Build the production bundle
	npm run build

lint: ## Run the linter
	npm run lint

test: ## Run the test suite
	npm run test

image: build ## Build the container image
	docker build -t $(IMAGE):$(REVISION) -t $(IMAGE):latest .

push: image ## Push the image to the internal registry
	docker push $(IMAGE):$(REVISION)
	docker push $(IMAGE):latest

deploy: push ## Roll the new image out to production
	ssh -i $(SSH_KEY) $(DEPLOY_HOST) "cd $(DEPLOY_PATH) && docker compose pull && docker compose up -d"

migrate: ## Apply pending database migrations
	PGPASSWORD="$(DB_PASSWORD)" psql -h $(DB_HOST) -U $(DB_USER) -d $(DB_NAME) -f migrations/latest.sql

backup: ## Dump the production database
	PGPASSWORD="$(DB_PASSWORD)" pg_dump -h $(DB_HOST) -U $(DB_USER) $(DB_NAME) | gzip > backup-$(REVISION).sql.gz

clean: ## Remove build artifacts
	rm -rf dist node_modules
`;

export const fakeMakefile: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
  });
};
