import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for an exposed ~/.git-credentials store (the plaintext
// file written by `git config credential.helper store`). Structurally
// authentic so the attacker believes they captured credentials, but
// every value is non-actionable per docs/RESPONSE_TEMPLATE_POLICY.md:
// invented usernames, REDACTED_FOR_HONEYPOT passwords, `.invalid`
// hosts, no canary.

const body = `https://deploy-bot:REDACTED_FOR_HONEYPOT@github.invalid
https://ci-runner:REDACTED_FOR_HONEYPOT@gitlab.invalid
https://svc-account:REDACTED_FOR_HONEYPOT@bitbucket.invalid
`;

export const fakeGitCredentials: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
  });
};
