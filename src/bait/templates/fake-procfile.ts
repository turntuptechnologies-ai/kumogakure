import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for a served `Procfile` — the process-type declaration used by
// Heroku-style and Foreman-style deployments, swept alongside the CI configs
// as part of the same served-repo hypothesis.
//
// A Procfile carries no secrets by convention, so this is a structure
// disclosure only (CWE-200): it names the process types, the runtime and
// worker framework in use, the queue names, and the release-phase migration
// command. That is still useful to a scanner building a picture of the stack,
// and serving it keeps the repo-artifact family coherent — a host that
// answers `Dockerfile` and `Makefile` but 404s `Procfile` is inconsistent.
// Fully static; never reflects the request.

const body = `web: gunicorn app.wsgi:application --bind 0.0.0.0:$PORT --workers 4 --timeout 60
worker: celery -A app worker --loglevel=info --concurrency=4 -Q default,email
beat: celery -A app beat --loglevel=info --schedule /tmp/celerybeat-schedule
release: python manage.py migrate --noinput && python manage.py collectstatic --noinput
`;

export const fakeProcfile: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
  });
};
