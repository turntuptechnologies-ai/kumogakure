import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for `app.yaml` — the App Engine service descriptor (CWE-200).
// Distinct from the Spring `application.yml` decoy: different product,
// different schema, and a different reason scanners want it. `env_variables:`
// is the idiomatic place App Engine deployments put runtime configuration,
// which in practice means plaintext database URLs, API keys, and session
// secrets sitting in a file that gets committed to the repo.
//
// Shaped as a standard-environment Python service: runtime, entrypoint,
// scaling block, `env_variables`, `vpc_access_connector`, and the handler
// list. Every secret is the non-actionable placeholder; the Cloud SQL
// instance name and hosts are invented / `.invalid`. Fully static.

const body = `runtime: python312
service: default
instance_class: F2

entrypoint: gunicorn -b :$PORT -w 4 main:app

automatic_scaling:
  min_instances: 1
  max_instances: 12
  target_cpu_utilization: 0.65
  max_concurrent_requests: 40

env_variables:
  APP_ENV: production
  SECRET_KEY: REDACTED_FOR_HONEYPOT
  DATABASE_URL: postgres://app_user:REDACTED_FOR_HONEYPOT@/app?host=/cloudsql/example-project:us-central1:app-db
  CLOUD_SQL_CONNECTION_NAME: example-project:us-central1:app-db
  REDIS_HOST: 10.0.0.11
  REDIS_PORT: "6379"
  GCS_BUCKET: example-project-uploads
  SENDGRID_API_KEY: REDACTED_FOR_HONEYPOT
  STRIPE_SECRET_KEY: REDACTED_FOR_HONEYPOT
  ALLOWED_HOSTS: app.example.invalid,example.invalid

vpc_access_connector:
  name: projects/example-project/locations/us-central1/connectors/app-connector

handlers:
  - url: /static
    static_dir: static
    secure: always

  - url: /admin/.*
    script: auto
    secure: always
    login: admin

  - url: /.*
    script: auto
    secure: always
`;

export const fakeGaeAppYaml: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/x-yaml; charset=UTF-8' },
  });
};
