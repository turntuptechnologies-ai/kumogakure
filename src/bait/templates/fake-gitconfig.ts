import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for an exposed global ~/.gitconfig (distinct from the
// repo .git/config handled by fake-git-config). `credential.helper =
// store` is a deliberate tell implying a ~/.git-credentials file
// exists, inviting the follow-up probe. Policy-compliant: invented
// identity, `.invalid` hosts, no real secrets, no canary.

const body = `[user]
	name = Deploy Bot
	email = deploy@example.invalid
[core]
	editor = vim
	autocrlf = input
[credential]
	helper = store
[init]
	defaultBranch = main
[pull]
	rebase = false
[push]
	default = simple
[url "https://github.invalid/"]
	insteadOf = git@github.invalid:
[alias]
	co = checkout
	br = branch
	st = status
	lg = log --oneline --graph --decorate
`;

export const fakeGitconfig: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
  });
};
