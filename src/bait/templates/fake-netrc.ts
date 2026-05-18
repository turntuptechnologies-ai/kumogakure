import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for an exposed ~/.netrc (the auto-login file honored by
// curl / wget / git-over-HTTPS / ftp). Structurally authentic so the
// attacker believes they captured machine credentials, but every
// secret is a non-actionable placeholder per
// docs/RESPONSE_TEMPLATE_POLICY.md. No canary.

const body = `machine github.invalid login deploy-bot password REDACTED_FOR_HONEYPOT
machine api.example.invalid login svc-account password REDACTED_FOR_HONEYPOT
machine ftp.example.invalid login backup password REDACTED_FOR_HONEYPOT
default login anonymous password user@example.invalid
`;

export const fakeNetrc: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
  });
};
