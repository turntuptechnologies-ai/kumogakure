import type { TemplateFn } from '../../types.js';

const body = 'example-fake-role\n';

export const awsMetadataRole: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
};
