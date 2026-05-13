import type { TemplateFn } from '../../types.js';

const body = `APP_NAME=example-honeypot
APP_ENV=production
APP_KEY=base64:RXhhbXBsZUtleU5vdEFjdHVhbGx5VmFsaWQK
APP_DEBUG=false
APP_URL=https://example.invalid

LOG_CHANNEL=stack
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=example_db
DB_USERNAME=db_user
DB_PASSWORD=REDACTED_FOR_HONEYPOT

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=REDACTED_FOR_HONEYPOT

MAIL_MAILER=smtp
MAIL_HOST=smtp.example.invalid
MAIL_PORT=587
MAIL_USERNAME=mailer@example.invalid
MAIL_PASSWORD=REDACTED_FOR_HONEYPOT
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=no-reply@example.invalid
MAIL_FROM_NAME="Example"

AWS_ACCESS_KEY_ID=EXAMPLE_AKIA1234567890ABCDEF
AWS_SECRET_ACCESS_KEY=REDACTED_FOR_HONEYPOT
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=example-honeypot-bucket
`;

export const fakeEnv: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
  });
};
