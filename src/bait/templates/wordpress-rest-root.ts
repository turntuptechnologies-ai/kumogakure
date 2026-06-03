import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for the WordPress REST API index at `wp-json/` (and bare
// `wp-json`). This is the discovery endpoint scanners hit first to
// confirm WP REST is reachable and learn the registered namespaces /
// routes before enumerating users and content. We return the documented
// index shape — site name/description, the core namespaces, and the
// `authentication` object — so the fingerprint lands. Generic site
// metadata only; static body, never reflects the request.

const body = JSON.stringify({
  name: 'Site',
  description: 'Just another WordPress site',
  url: 'https://example.invalid',
  home: 'https://example.invalid',
  gmt_offset: 0,
  timezone_string: '',
  namespaces: ['oembed/1.0', 'wp/v2', 'wp-site-health/v1'],
  authentication: {},
  routes: {
    '/': { namespace: '', methods: ['GET'] },
    '/oembed/1.0': { namespace: 'oembed/1.0', methods: ['GET'] },
    '/wp/v2': { namespace: 'wp/v2', methods: ['GET'] },
    '/wp/v2/posts': { namespace: 'wp/v2', methods: ['GET', 'POST'] },
    '/wp/v2/users': { namespace: 'wp/v2', methods: ['GET', 'POST'] },
  },
});

export const wordpressRestRoot: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      Link: '<https://example.invalid/wp-json/>; rel="https://api.w.org/"',
    },
  });
};
