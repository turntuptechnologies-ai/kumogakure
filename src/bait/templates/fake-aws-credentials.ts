import type { TemplateFn } from '../../types.js';

const body = `[default]
aws_access_key_id = EXAMPLE_AKIA1234567890ABCDEF
aws_secret_access_key = REDACTED_FOR_HONEYPOT
region = us-east-1
`;

export const fakeAwsCredentials: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
  });
};
