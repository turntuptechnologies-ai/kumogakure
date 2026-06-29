import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for an exposed Subversion working copy's `.svn/entries`
// (CWE-538 source disclosure — the SVN parallel to a leaked `.git/`).
// Scanners read it to confirm `.svn` is present and, in the pre-1.7
// ("format 10") layout, to harvest the repository URL and walk the tree.
// We serve that old text format with a fabricated repo URL on a
// non-routable `.invalid` host — the disclosure scanners want, leaking no
// real location. Coherent with the router 404ing `.svn/wc.db` (a format-10
// working copy has no SQLite store). Static; the request is never reflected.

const body = `10

dir
1487
https://svn.internal.invalid/app/trunk
https://svn.internal.invalid/app



2026-05-30T08:14:22.482913Z
1487
deploy

svn:special svn:externals svn:needs-lock



















9f6c1d2a-4e3b-4a1c-9b8e-7d2c5a0f1e34
`;

export const fakeSvnEntries: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
  });
};
