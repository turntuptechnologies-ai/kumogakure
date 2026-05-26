import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for Symfony's `parameters.yml`. The Symfony 2.x / 3.x
// convention put DB credentials, mailer SMTP credentials, and the
// app-wide `secret` (used by CSRF / cookie / remember-me HMACs) in
// `app/config/parameters.yml`; later versions moved them to
// `.env`/`config/services.yaml`, but the legacy path remains a
// scanner staple. CWE-200 / CWE-538 disclosure class.
//
// Output is the canonical Symfony parameters shape — single top-level
// `parameters:` map with `database_*` / `mailer_*` / `secret`.

const body = `parameters:
  database_host: db.example.invalid
  database_port: 3306
  database_name: example
  database_user: app_user
  database_password: REDACTED_FOR_HONEYPOT
  mailer_transport: smtp
  mailer_host: smtp.example.invalid
  mailer_user: mailer@example.invalid
  mailer_password: REDACTED_FOR_HONEYPOT
  secret: REDACTED_FOR_HONEYPOT
  locale: en
`;

export const symfonyParametersYml: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/x-yaml; charset=UTF-8' },
  });
};
