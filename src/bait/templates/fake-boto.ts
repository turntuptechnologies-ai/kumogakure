import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for an exposed ~/.boto (boto / gsutil config).
// Structurally authentic; every secret is a non-actionable
// placeholder per docs/RESPONSE_TEMPLATE_POLICY.md. No canary.

const body = `[Credentials]
aws_access_key_id = EXAMPLE_AKIA1234567890ABCDEF
aws_secret_access_key = REDACTED_FOR_HONEYPOT

[Boto]
https_validate_certificates = True

[GSUtil]
default_project_id = example-honeypot-project
`;

export const fakeBoto: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
  });
};
