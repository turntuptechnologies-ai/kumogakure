import type { TemplateFn } from '../../types.js';

// Tier 3 response for `wp-admin/` directories that have an `index.php`
// behind `auth_redirect()` (`/wp-admin/`, `/wp-admin/network/`,
// `/wp-admin/user/`): an unauthenticated visitor gets a 302 to the login
// page carrying `redirect_to` back to the requested URL and `reauth=1`,
// exactly as WordPress builds it. Leads on to the existing
// `wordpress-login` decoy. The host is the one the request came in on,
// not a fabricated domain.

export const wordpressAdminRedirect: TemplateFn = (ctx) => {
  const requested = new URL(ctx.request.url);
  const login = new URL('/wp-login.php', requested.origin);
  login.searchParams.set('redirect_to', requested.href);
  login.searchParams.set('reauth', '1');
  return new Response(null, {
    status: 302,
    headers: { Location: login.href, 'Content-Type': 'text/html; charset=UTF-8' },
  });
};
