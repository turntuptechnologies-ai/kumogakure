import type { HeaderEntry } from '../types.js';

// Header-signature bait, consulted only after the path-based catalog /
// pattern lookups miss (see index.ts) — so it never hijacks a known
// product-path probe. Targets requests whose routing signal is a header,
// not the URL path.
export const headerBait: HeaderEntry[] = [
  // Next.js (App Router) Server Actions are dispatched by the
  // `Next-Action` header carrying the action-ID hash, and are POSTed to
  // the current page URL (any path), so a path match can't catch them.
  // Scanners spray the header to fingerprint Next.js and probe action
  // invocation — the auth-bypass / file-write (upload) / SSRF surface of
  // server actions. The decoy returns a benign RSC flight response.
  {
    signature: 'nextjs-server-action',
    match: (h) => h.has('next-action'),
    category: 'cve-recon',
    subcategory: 'nextjs-server-action',
    template: 'nextjs-server-action',
  },
];

export function findHeaderBait(request: Request): HeaderEntry | undefined {
  return headerBait.find((entry) => entry.match(request.headers));
}
