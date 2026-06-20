import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for the WordPress core sitemap index (`/wp-sitemap.xml`,
// WP 5.5+). It is the discovery entry point a scanner reads first; among
// the sub-sitemaps it lists is `wp-sitemap-users-1.xml`, which our
// `wordpress-user-sitemap` decoy serves (one `/author/<slug>/` URL per
// account). Serving the index makes that chain coherent — index ->
// user sitemap -> username slugs — so a scanner following it lands on the
// existing enumeration decoy rather than a 404. Static XML, attacker input
// never reflected.

const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
\t<sitemap>
\t\t<loc>https://example.invalid/wp-sitemap-posts-post-1.xml</loc>
\t</sitemap>
\t<sitemap>
\t\t<loc>https://example.invalid/wp-sitemap-posts-page-1.xml</loc>
\t</sitemap>
\t<sitemap>
\t\t<loc>https://example.invalid/wp-sitemap-taxonomies-category-1.xml</loc>
\t</sitemap>
\t<sitemap>
\t\t<loc>https://example.invalid/wp-sitemap-users-1.xml</loc>
\t</sitemap>
</sitemapindex>
`;

export const wordpressSitemapIndex: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/xml; charset=UTF-8' },
  });
};
