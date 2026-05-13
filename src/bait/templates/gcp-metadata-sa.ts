import type { TemplateFn } from '../../types.js';

const body = `default/
example-honeypot@example-honeypot.iam.gserviceaccount.com/
`;

export const gcpMetadataSa: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/text',
      'Metadata-Flavor': 'Google',
    },
  });
};
