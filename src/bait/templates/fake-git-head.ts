import type { TemplateFn } from '../../types.js';

const body = 'ref: refs/heads/main\n';

export const fakeGitHead: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
  });
};
