import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for an exposed ~/.npmrc — the file that carries the npm
// publish token (`_authToken`). Structurally authentic so the attacker
// believes they captured a supply-chain publish credential, but the
// token is a non-actionable placeholder per
// docs/RESPONSE_TEMPLATE_POLICY.md. No canary.

const body = `registry=https://registry.npmjs.org/
//registry.npmjs.org/:_authToken=REDACTED_FOR_HONEYPOT
@example-scope:registry=https://npm.example.invalid/
//npm.example.invalid/:_authToken=REDACTED_FOR_HONEYPOT
always-auth=true
save-exact=true
`;

export const fakeNpmrc: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
  });
};
