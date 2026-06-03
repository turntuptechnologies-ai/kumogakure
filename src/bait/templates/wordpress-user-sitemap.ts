import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for the WordPress sitemaps that enumerate user accounts:
//   - `/wp-sitemap-users-<n>.xml` — WordPress core (5.5+) user sitemap
//   - `/author-sitemap.xml`       — Yoast SEO / Rank Math author sitemap
// Both list one `…/author/<slug>/` URL per account, so they leak the
// username slug set without auth — the same credential-stuffing input as
// the `wp/v2/users` REST endpoint, just via XML. Scanners that find REST
// user enumeration disabled fall back to these.
//
// We return a standard sitemap `<urlset>` of author URLs for the SAME
// fabricated accounts the `wordpress-users-api` / `wordpress-plugin-users`
// decoys serve, so the slug set is consistent across surfaces. Static
// body; the request is never reflected.

const slugs = ['editor', 'staff', 'marketing'];

const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${slugs
  .map(
    (slug) =>
      `<url><loc>https://example.invalid/author/${slug}/</loc><lastmod>2024-01-01T00:00:00+00:00</lastmod></url>`,
  )
  .join('\n')}
</urlset>`;

export const wordpressUserSitemap: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/xml; charset=UTF-8' },
  });
};
