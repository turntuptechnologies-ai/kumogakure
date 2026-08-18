import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for Flask's `app.py` entrypoint — the file Flask's own
// quickstart names the app in, and where small/tutorial-derived apps
// (skipping a separate config.py) hardcode `app.secret_key` directly
// instead of reading it from the environment. Source disclosure here is
// CWE-798 (hardcoded credential) as much as CWE-200 — the leaked value is
// what signs Flask's session cookies.

const body = `from flask import Flask, jsonify

app = Flask(__name__)
app.secret_key = 'REDACTED_FOR_HONEYPOT'
app.config['SQLALCHEMY_DATABASE_URI'] = (
    'postgresql://app_user:REDACTED_FOR_HONEYPOT@db.example.invalid:5432/example'
)


@app.route('/')
def index():
    return jsonify(status='ok')


@app.route('/health')
def health():
    return jsonify(status='ok')


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
`;

export const flaskAppPy: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/x-python; charset=UTF-8' },
  });
};
