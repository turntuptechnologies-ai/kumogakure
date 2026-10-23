import type { TemplateFn } from '../../types.js';

// Tier 3 status-only 403: the answer a real web server with directory
// indexes disabled (`Options -Indexes` / `autoindex off`) gives for an
// existing directory that has no index file. Mirrors the plain-text
// `not-found` 404 style.

export const forbidden: TemplateFn = () => {
  return new Response('Forbidden', {
    status: 403,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
