import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for WordPress core `wp-admin/admin-ajax.php`. Every real WP
// install ships this endpoint, so a host that serves wp-login.php but 404s
// admin-ajax.php is an obvious tell — this closes that coherence gap.
// Scanners also hit it directly as a WP fingerprint and to reach the
// unauthenticated `wp_ajax_nopriv_*` action surface (plugin AJAX CVEs,
// admin-ajax DoS). With no registered `action`, WordPress dispatches
// nothing and ends at `wp_die('0')` — HTTP 400 with the bare body `0`,
// which is the literal response scanners match on. We mirror exactly that;
// no action is ever executed and the request is never reflected.

export const wordpressAdminAjax: TemplateFn = () => {
  return new Response('0', {
    status: 400,
    headers: { 'Content-Type': 'text/html; charset=UTF-8' },
  });
};
