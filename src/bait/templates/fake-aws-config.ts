import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for an exposed ~/.aws/config (structural, non-secret —
// region/profiles/role assumption). Uses AWS's canonical documented
// example account id (123456789012); no real entities, no secrets, no
// canary.

const body = `[default]
region = us-east-1
output = json

[profile prod]
region = us-west-2
role_arn = arn:aws:iam::123456789012:role/ExampleDeployRole
source_profile = default

[profile ci]
region = us-east-1
output = json
`;

export const fakeAwsConfig: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
  });
};
