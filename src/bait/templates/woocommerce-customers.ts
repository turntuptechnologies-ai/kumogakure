import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for the WooCommerce REST API customer collection
// (`wp-json/wc/v<n>/customers`). The WooCommerce list endpoints are
// authenticated (consumer key/secret, or a logged-in admin); an
// anonymous GET returns `401 woocommerce_rest_cannot_view`. Scanners
// probe it to enumerate customer PII and to test for leaked / weak
// REST API keys. We return the authentic 401: it confirms WooCommerce
// is installed (the `woocommerce_rest_*` code namespace is WC-specific)
// while truthfully reporting "you cannot list resources" — serving a
// customer list here would falsely advertise an auth bypass and leak
// fabricated PII. Static body, no request reflection, no canary.

const body = JSON.stringify({
  code: 'woocommerce_rest_cannot_view',
  message: 'Sorry, you cannot list resources.',
  data: { status: 401 },
});

export const woocommerceCustomers: TemplateFn = () => {
  return new Response(body, {
    status: 401,
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
  });
};
