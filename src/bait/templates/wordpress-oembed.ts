import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for the WordPress REST `wp-json/oembed/1.0/embed`
// endpoint. The endpoint requires a `?url=` query parameter; without
// it, real WP returns a 400 with the canonical `rest_missing_callback_param`
// error envelope. Scanners hit the bare path just to fingerprint
// that WP REST is reachable — returning the authentic missing-param
// error gives them that positive signal while leaking nothing.
//
// We mirror that exact shape verbatim. status=400 is the real value
// WP returns here.

const body = JSON.stringify({
  code: 'rest_missing_callback_param',
  message: 'Missing parameter(s): url',
  data: {
    status: 400,
    params: ['url'],
  },
});

export const wordpressOembed: TemplateFn = () => {
  return new Response(body, {
    status: 400,
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
  });
};
