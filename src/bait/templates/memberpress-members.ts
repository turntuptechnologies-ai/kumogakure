import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for the MemberPress (Developer Tools) REST API member
// collection (`wp-json/mepr/v<n>/members`). The route is gated by a
// `MEMBERPRESS-API-KEY` permission check; an anonymous probe fails it
// and gets the WordPress-core `401 rest_forbidden`. Scanners hit it to
// enumerate member PII (email, membership, address) and to test for a
// leaked API key. We return the authentic 401 rather than a member
// list: returning members would falsely advertise an auth bypass and
// leak fabricated PII. Static body, no request reflection, no canary.

const body = JSON.stringify({
  code: 'rest_forbidden',
  message: 'Sorry, you are not allowed to do that.',
  data: { status: 401 },
});

export const memberpressMembers: TemplateFn = () => {
  return new Response(body, {
    status: 401,
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
  });
};
