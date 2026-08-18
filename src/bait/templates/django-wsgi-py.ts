import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for Django's `wsgi.py` module entrypoint, same
// misconfiguration class and boilerplate-only rationale as
// `django-manage-py`. Observed in the same probe burst as `manage.py` —
// scanners fetch both once a Django install is suspected.

const body = `"""
WSGI config for example project.

It exposes the WSGI callable as a module-level variable named \`\`application\`\`.
"""
import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'example.settings')

application = get_wsgi_application()
`;

export const djangoWsgiPy: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/x-python; charset=UTF-8' },
  });
};
