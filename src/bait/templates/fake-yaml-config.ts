import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for the generic YAML secrets sweep — `config.yml` /
// `config.yaml`, Rails' `secrets.yml`, and the Rails / Paperclip S3
// credential file `aws.yml`, at any depth. Scanners spray these basenames
// hunting for cleartext DB passwords, signing keys, and cloud credentials
// (CWE-200 / CWE-538).
//
// The three files have unrelated schemas, so — as in fake-ci-pipeline — the
// document is picked from a fixed lookup on the matched `subcategory` (our
// own classification constant, never attacker input). Hosts are `.invalid`;
// secrets are `REDACTED_FOR_HONEYPOT` / `EXAMPLE_`-prefixed.

const appConfig = `app:
  name: example-app
  env: production
  url: https://app.example.invalid
  secret_key: REDACTED_FOR_HONEYPOT

database:
  host: db.example.invalid
  port: 5432
  name: example
  user: app_user
  password: REDACTED_FOR_HONEYPOT

redis:
  url: redis://:REDACTED_FOR_HONEYPOT@redis.example.invalid:6379/0

mail:
  smtp_host: smtp.example.invalid
  smtp_port: 587
  username: noreply@example.invalid
  password: REDACTED_FOR_HONEYPOT

logging:
  level: info
`;

const railsSecrets = `# Be sure to restart your server when you modify this file.

development:
  secret_key_base: REDACTED_FOR_HONEYPOT

test:
  secret_key_base: REDACTED_FOR_HONEYPOT

production:
  secret_key_base: REDACTED_FOR_HONEYPOT
  stripe_secret_key: REDACTED_FOR_HONEYPOT
  smtp_password: REDACTED_FOR_HONEYPOT
`;

const awsYml = `development:
  access_key_id: EXAMPLE_AKIA1234567890ABCDEF
  secret_access_key: REDACTED_FOR_HONEYPOT
  bucket: example-app-development
  region: us-east-1

production:
  access_key_id: EXAMPLE_AKIA1234567890ABCDEF
  secret_access_key: REDACTED_FOR_HONEYPOT
  bucket: example-app-production
  region: us-east-1
`;

const bySubcategory: Record<string, string> = {
  'yaml-config': appConfig,
  'rails-secrets': railsSecrets,
  'cloud-credentials': awsYml,
};

export const fakeYamlConfig: TemplateFn = ({ subcategory }) => {
  // Falls back to the generic app config if the subcategory is somehow
  // absent; any format-valid config is a better answer than an empty body.
  const body = (subcategory && bySubcategory[subcategory]) ?? appConfig;
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/x-yaml; charset=UTF-8' },
  });
};
