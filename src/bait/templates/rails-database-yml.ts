import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for Rails' `config/database.yml` (and any-depth
// `database.yml`). Served as a static file when the app root is exposed, it
// discloses per-environment DB credentials in cleartext (CWE-200 /
// CWE-538). Standard `rails new` layout — a `default` anchor merged into
// each environment — with a production password hardcoded the way careless
// deployments leave it instead of using `ENV[...]`.
//
// Hosts are `.invalid`, passwords are `REDACTED_FOR_HONEYPOT`. Fully static.

const body = `default: &default
  adapter: postgresql
  encoding: unicode
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>

development:
  <<: *default
  database: example_development

test:
  <<: *default
  database: example_test

production:
  <<: *default
  host: db.example.invalid
  port: 5432
  database: example_production
  username: example
  password: REDACTED_FOR_HONEYPOT
`;

export const railsDatabaseYml: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/x-yaml; charset=UTF-8' },
  });
};
