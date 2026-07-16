import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for WordPress `wp-content/debug.log` — the file WP writes
// when `WP_DEBUG_LOG` is left on in production. Scanners pull it (CWE-200)
// to harvest the absolute web root, installed plugin/theme names and
// versions, and DB/query structure from the logged errors — recon that
// feeds targeted follow-up. We return a plausible log of PHP deprecations /
// warnings and a WP DB notice: it discloses the structure a scanner wants
// while leaking no credential (paths under a fabricated `/var/www` root).
// Fully static; the request is never reflected.

const body = `[14-Jul-2026 03:11:07 UTC] PHP Deprecated:  Creation of dynamic property WP_Block_Type::$editor_script is deprecated in /var/www/html/wp-includes/class-wp-block-type.php on line 414
[14-Jul-2026 03:11:07 UTC] PHP Notice:  Function _load_textdomain_just_in_time was called incorrectly. Translation loading for the woocommerce domain was triggered too early. in /var/www/html/wp-includes/functions.php on line 6114
[14-Jul-2026 09:42:55 UTC] PHP Warning:  Undefined array key "HTTP_X_FORWARDED_FOR" in /var/www/html/wp-content/plugins/wordfence/vendor/wordfence/wf-waf/src/lib/waf.php on line 812
[15-Jul-2026 01:07:33 UTC] PHP Deprecated:  strlen(): Passing null to parameter #1 ($string) of type string is deprecated in /var/www/html/wp-content/themes/astra/inc/class-astra-attr.php on line 143
[15-Jul-2026 08:20:19 UTC] WordPress database error Duplicate entry '0' for key 'PRIMARY' for query INSERT INTO wp_options (option_name, option_value, autoload) VALUES ('_transient_doing_cron', '1752566419.0', 'yes') made by wp-cron.php
[15-Jul-2026 08:20:19 UTC] PHP Fatal error:  Uncaught Error: Call to undefined function wc_get_product() in /var/www/html/wp-content/plugins/custom-shop/includes/cart.php:57
`;

export const fakeWpDebugLog: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
  });
};
