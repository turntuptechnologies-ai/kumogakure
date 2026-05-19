import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for an exposed .git/ directory index. A generic
// autoindex layout (permitted) listing the standard repository
// entries, which leads the attacker on to the existing fake
// .git/config and .git/HEAD (coherent decoy chain). No secrets, no
// canary, static.

const body = `<!DOCTYPE html>
<html>
<head><title>Index of /.git</title></head>
<body>
<h1>Index of /.git</h1>
<pre><a href="../">../</a>
<a href="branches/">branches/</a>
<a href="hooks/">hooks/</a>
<a href="info/">info/</a>
<a href="logs/">logs/</a>
<a href="objects/">objects/</a>
<a href="refs/">refs/</a>
<a href="HEAD">HEAD</a>
<a href="config">config</a>
<a href="description">description</a>
<a href="index">index</a>
<a href="packed-refs">packed-refs</a>
</pre>
</body>
</html>
`;

export const fakeGitDirListing: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=UTF-8' },
  });
};
