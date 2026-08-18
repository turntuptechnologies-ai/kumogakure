import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for Flask's `Config` object convention — both the
// project-root `config.py` a `from config import Config` imports, and the
// `instance/config.py` Flask's own docs recommend specifically as the
// place to keep values "that shouldn't be committed to version control ...
// or configuration secrets": SECRET_KEY, the DB URI, and mail credentials.
// Source disclosure here is CWE-200 / CWE-538, same class as Django's
// settings.py.

const body = `import os

basedir = os.path.abspath(os.path.dirname(__file__))


class Config:
    SECRET_KEY = 'REDACTED_FOR_HONEYPOT'
    SQLALCHEMY_DATABASE_URI = 'postgresql://app_user:REDACTED_FOR_HONEYPOT@db.example.invalid:5432/example'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    MAIL_SERVER = 'smtp.example.invalid'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = 'mailer@example.invalid'
    MAIL_PASSWORD = 'REDACTED_FOR_HONEYPOT'

    DEBUG = False
`;

export const flaskConfig: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/x-python; charset=UTF-8' },
  });
};
