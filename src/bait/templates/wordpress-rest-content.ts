import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for the public WordPress core REST content collections
// under `wp-json/wp/v2/` — posts, pages, comments, media, categories,
// tags. Left on the default permissions these return site content (and,
// for posts/media, the authoring user id) without auth, which scanners
// harvest for content/author recon (CWE-200). We serve a small, plausible
// collection per type, with `author: 1` tying back to the same fabricated
// roster the user-enumeration decoys use, so the picture stays coherent.
// Unknown/unsupported collections fall back to an empty `[]`, which is a
// valid WP response (a site with no items of that type) and leaks nothing.
//
// The collection is chosen by EXACT match of the final path segment
// against a fixed Map (pre-serialised constant bodies, prototype-safe
// lookup) — the attacker-supplied path is never reflected into the body.

const post = {
  id: 101,
  date: '2024-01-15T09:00:00',
  slug: 'hello-world',
  status: 'publish',
  type: 'post',
  link: 'https://example.invalid/hello-world/',
  title: { rendered: 'Hello world' },
  excerpt: { rendered: '<p>Welcome to the site.</p>' },
  author: 1,
};

const bodyByCollection = new Map<string, string>([
  ['posts', JSON.stringify([post])],
  [
    'pages',
    JSON.stringify([{ ...post, id: 2, slug: 'about', type: 'page', title: { rendered: 'About' } }]),
  ],
  [
    'comments',
    JSON.stringify([
      {
        id: 1,
        post: 101,
        author_name: 'A. Visitor',
        date: '2024-01-16T10:00:00',
        content: { rendered: '<p>Thanks for the post.</p>' },
        link: 'https://example.invalid/hello-world/#comment-1',
      },
    ]),
  ],
  [
    'media',
    JSON.stringify([
      {
        id: 201,
        date: '2024-01-10T08:00:00',
        slug: 'logo',
        type: 'attachment',
        media_type: 'image',
        mime_type: 'image/png',
        source_url: 'https://example.invalid/wp-content/uploads/2024/01/logo.png',
        title: { rendered: 'logo' },
        author: 1,
      },
    ]),
  ],
  [
    'categories',
    JSON.stringify([
      { id: 1, count: 3, name: 'Uncategorized', slug: 'uncategorized', taxonomy: 'category' },
    ]),
  ],
  ['tags', JSON.stringify([{ id: 5, count: 1, name: 'news', slug: 'news', taxonomy: 'post_tag' }])],
]);

const COLLECTION_FROM_PATH = /wp-json\/wp\/v2\/([a-z]+)\/?$/;
const emptyCollection = '[]';

export const wordpressRestContent: TemplateFn = (ctx) => {
  const collection = COLLECTION_FROM_PATH.exec(ctx.path)?.[1];
  const body =
    (collection !== undefined ? bodyByCollection.get(collection) : undefined) ?? emptyCollection;
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
  });
};
