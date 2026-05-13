import type { TemplateFn } from '../../types.js';

const body = 'File uploaded successfully.\n';

export const uploadSuccess: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
  });
};
