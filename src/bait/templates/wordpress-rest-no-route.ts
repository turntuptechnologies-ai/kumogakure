import type { TemplateFn } from '../../types.js';

// Tier 3 response for unmatched `wp-json/...` routes: WordPress's own
// `rest_no_route` JSON 404 instead of the plain-text `not-found` stub, so
// a host that otherwise looks like WordPress does not reveal itself on
// every plugin route a scanner tries. It is also what real WordPress
// returns for a GET to a POST-only route (e.g. plugin password-reset
// endpoints), so it is authentic for those too.

const body = JSON.stringify({
  code: 'rest_no_route',
  message: 'No route was found matching the URL and request method.',
  data: { status: 404 },
});

export const wordpressRestNoRoute: TemplateFn = () => {
  return new Response(body, {
    status: 404,
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
  });
};
