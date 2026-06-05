import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for the WordPress REST `wp-json/wp/v2/users/me` endpoint —
// "the current user". Unlike the `wp/v2/users` collection (which leaks
// the account list on default permissions), `/me` requires an
// authenticated session; an unauthenticated request gets a 401 with the
// `rest_not_logged_in` code. Scanners hammer it (high volume, many
// sources) both as a definitive WP-REST fingerprint and to detect leaked
// sessions / auth-bypass. We return the authentic 401 body: it confirms
// WP REST is present (the `rest_not_logged_in` code is WP-specific) while
// truthfully reporting "not logged in" — returning a user here would
// falsely advertise an auth bypass and contradict the install's real
// behaviour. Static body, no request reflection, no canary.

const body = JSON.stringify({
  code: 'rest_not_logged_in',
  message: 'You are not currently logged in.',
  data: { status: 401 },
});

export const wordpressUsersMe: TemplateFn = () => {
  return new Response(body, {
    status: 401,
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
  });
};
