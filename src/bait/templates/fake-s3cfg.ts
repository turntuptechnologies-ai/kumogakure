import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for an exposed ~/.s3cfg (s3cmd config). Structurally
// authentic so the attacker believes they captured S3 keys, but the
// secrets are non-actionable placeholders per
// docs/RESPONSE_TEMPLATE_POLICY.md. No canary.

const body = `[default]
access_key = EXAMPLE_AKIA1234567890ABCDEF
secret_key = REDACTED_FOR_HONEYPOT
bucket_location = us-east-1
host_base = s3.amazonaws.com
host_bucket = %(bucket)s.s3.amazonaws.com
use_https = True
signature_v2 = False
`;

export const fakeS3cfg: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
  });
};
