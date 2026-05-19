import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for an exposed .gitmodules. Submodule URLs are the
// enticing part (they can reveal internal infra), so they are
// fabricated on the `.invalid` TLD per docs/RESPONSE_TEMPLATE_POLICY.md.
// No canary, static.

const body = `[submodule "libs/shared"]
	path = libs/shared
	url = https://git.example.invalid/internal/shared.git
[submodule "vendor/theme"]
	path = vendor/theme
	url = https://git.example.invalid/vendor/theme.git
`;

export const fakeGitmodules: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
  });
};
