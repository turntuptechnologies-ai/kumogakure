import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for Flask's `.flaskenv` — the python-dotenv file `flask run`
// auto-loads for FLASK_APP / FLASK_ENV, and where projects that skip a
// separate `config.py` put SECRET_KEY / DATABASE_URL directly. Same
// disclosure class as the Laravel/Node `.env` family (fake-env.ts), kept
// as its own decoy since the key set is Flask-specific and a scanner that
// parses the response would notice APP_KEY / DB_CONNECTION where FLASK_APP
// belongs.

const body = `FLASK_APP=app.py
FLASK_ENV=production
FLASK_DEBUG=0
SECRET_KEY=REDACTED_FOR_HONEYPOT
DATABASE_URL=postgresql://app_user:REDACTED_FOR_HONEYPOT@db.example.invalid:5432/example
MAIL_USERNAME=mailer@example.invalid
MAIL_PASSWORD=REDACTED_FOR_HONEYPOT
`;

export const fakeFlaskenv: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
  });
};
