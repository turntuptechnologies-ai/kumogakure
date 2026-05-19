import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for an exposed .gitignore. Realistic, benign, static —
// no secrets, no canary.

const body = `node_modules/
dist/
build/
coverage/
.env
.env.*
*.log
*.tmp
.DS_Store
.idea/
.vscode/
`;

export const fakeGitignore: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
  });
};
