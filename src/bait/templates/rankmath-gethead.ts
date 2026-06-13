import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for the Rank Math SEO REST route `wp-json/rankmath/v1/getHead`.
// The endpoint takes a `?url=` parameter and fetches that URL server-side
// to return its `<head>` markup — an SSRF / open-proxy surface that
// scanners probe to reach internal services and cloud metadata. This
// decoy is low-interaction: it NEVER performs the fetch. The honeypot
// still captures the probe and any `?url=` payload (recorded from the
// request); here we mirror Rank Math's behaviour when `url` is absent —
// WordPress returns `400 rest_missing_callback_param` naming the missing
// param. Static body, no request reflection, no canary.

const body = JSON.stringify({
  code: 'rest_missing_callback_param',
  message: 'Missing parameter(s): url',
  data: { status: 400, params: ['url'] },
});

export const rankmathGethead: TemplateFn = () => {
  return new Response(body, {
    status: 400,
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
  });
};
