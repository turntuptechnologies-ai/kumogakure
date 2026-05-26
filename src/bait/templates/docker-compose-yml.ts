import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for `docker-compose.yml` (and the override / per-env
// variants — `.override.yml`, `.prod.yml`, `.staging.yml`, etc.).
// Source disclosure of compose files leaks `environment:` blocks,
// which routinely carry plaintext `DATABASE_URL`, `JWT_SECRET`,
// `REDIS_PASSWORD`, and per-service Postgres credentials —
// CWE-200 / CWE-538 disclosure class.
//
// We render a minimal three-service stack (app + postgres + redis)
// with placeholder image tags and `REDACTED_FOR_HONEYPOT` secrets.

const body = `version: '3.8'

services:
  app:
    image: example/app:1.0.0
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: postgres://app_user:REDACTED_FOR_HONEYPOT@db:5432/example
      JWT_SECRET: REDACTED_FOR_HONEYPOT
      REDIS_PASSWORD: REDACTED_FOR_HONEYPOT
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      POSTGRES_USER: app_user
      POSTGRES_PASSWORD: REDACTED_FOR_HONEYPOT
      POSTGRES_DB: example
    volumes:
      - db-data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass REDACTED_FOR_HONEYPOT

volumes:
  db-data:
`;

export const dockerComposeYml: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/x-yaml; charset=UTF-8' },
  });
};
