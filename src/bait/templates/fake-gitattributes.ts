import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for an exposed .gitattributes. Realistic, benign,
// static — no secrets, no canary.

const body = `* text=auto eol=lf
*.sh text eol=lf
*.bat text eol=crlf
*.png binary
*.jpg binary
*.gz binary
package-lock.json -diff
`;

export const fakeGitattributes: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
  });
};
