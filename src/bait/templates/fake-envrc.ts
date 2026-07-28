import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for `.envrc` — direnv's per-directory shell hook. The
// `export`-form sibling of the `.env` family already covered by `fake-env`,
// and a distinct product: direnv evaluates `.envrc` as shell, so a real one
// mixes `export` assignments with layout/source directives and occasionally
// with a command that pulls a secret out of a vault.
//
// Same disclosure class as `.env` (CWE-200 / CWE-538) and the reason scanners
// sweep it separately: `.envrc` is far less likely to be in a project's
// `.gitignore` than `.env` is, so it leaks more often. Every secret is the
// non-actionable placeholder; hosts are `.invalid`. Fully static.

const body = `# shellcheck shell=bash
# direnv configuration — run \`direnv allow\` after editing.

layout node

# Load the non-secret defaults, then the local overrides if present.
dotenv_if_exists .env.defaults
dotenv_if_exists .env.local

export APP_ENV=production
export APP_URL=https://example.invalid
export LOG_LEVEL=info
export TZ=UTC

export DATABASE_URL=postgres://app_user:REDACTED_FOR_HONEYPOT@db.internal.invalid:5432/app_production
export REDIS_URL=redis://cache.internal.invalid:6379/0
export SESSION_SECRET=REDACTED_FOR_HONEYPOT

export AWS_ACCESS_KEY_ID=EXAMPLE_AKIA1234567890ABCDEF
export AWS_SECRET_ACCESS_KEY=REDACTED_FOR_HONEYPOT
export AWS_DEFAULT_REGION=us-east-1
export S3_BUCKET=example-honeypot-bucket

export SMTP_HOST=smtp.example.invalid
export SMTP_PORT=587
export SMTP_USER=mailer@example.invalid
export SMTP_PASSWORD=REDACTED_FOR_HONEYPOT

export NPM_TOKEN=REDACTED_FOR_HONEYPOT
export SENTRY_DSN=https://REDACTED_FOR_HONEYPOT@sentry.internal.invalid/4

PATH_add ./node_modules/.bin
PATH_add ./bin
`;

export const fakeEnvrc: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
  });
};
