import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for `aws-credentials.json` / `aws_credentials.json` sweeps.
// Apps that persist AWS keys as JSON (rather than the INI `~/.aws/credentials`
// served by fake-aws-credentials) use the SDK-style camelCase keys. Scanners
// spray the basename at any depth hunting for harvestable access keys
// (CWE-200 / CWE-538). Same non-actionable placeholder convention as the
// INI decoy (EXAMPLE_ / REDACTED), so a scanner banks "credentials" we can
// capture follow-on use of. Fully static; the request is never reflected.

const body = JSON.stringify(
  {
    accessKeyId: 'EXAMPLE_AKIA1234567890ABCDEF',
    secretAccessKey: 'REDACTED_FOR_HONEYPOT',
    region: 'us-east-1',
  },
  null,
  2,
);

export const fakeAwsCredentialsJson: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
  });
};
