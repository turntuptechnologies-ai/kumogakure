import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for the WordPress REST `wp-json/wp/v2/users/`
// endpoint. When a WP install is left with the default permissions,
// this returns the list of users (id, slug, display name, bio,
// avatar URLs) WITHOUT requiring auth — which is exactly the input
// a credential-stuffing scanner wants to consume for follow-on
// brute-force attempts. We feed it plausible-looking generic role
// names so the scanner records "valid users" and proceeds to its
// next stage, which is what we want to capture. No real person's
// name. No password / email field (WP doesn't include those in the
// public response either).
//
// `secure.gravatar.com` URLs are the WP-default avatar host (format
// convention, not org attribution); the hash placeholders are
// zeroes, not derived from any real email.

const users = [
  {
    id: 1,
    name: 'Editorial Team',
    url: 'https://example.invalid',
    description: 'Editorial team account.',
    link: 'https://example.invalid/author/editor/',
    slug: 'editor',
  },
  {
    id: 2,
    name: 'Staff',
    url: 'https://example.invalid',
    description: 'Staff account.',
    link: 'https://example.invalid/author/staff/',
    slug: 'staff',
  },
  {
    id: 3,
    name: 'Marketing',
    url: 'https://example.invalid',
    description: 'Marketing team account.',
    link: 'https://example.invalid/author/marketing/',
    slug: 'marketing',
  },
];

const placeholderAvatarHash = '0'.repeat(32);

// Enriched public-user objects, exported as the single source of truth so
// the by-id decoy (`wp/v2/users/<id>`) serves the exact same record the
// collection advertises — a scanner that lists then pulls by id sees a
// coherent 3-user site (drift-guard test asserts they agree).
export const publicUsers = users.map((u) => ({
  ...u,
  avatar_urls: {
    '24': `https://secure.gravatar.com/avatar/${placeholderAvatarHash}?s=24&d=mm&r=g`,
    '48': `https://secure.gravatar.com/avatar/${placeholderAvatarHash}?s=48&d=mm&r=g`,
    '96': `https://secure.gravatar.com/avatar/${placeholderAvatarHash}?s=96&d=mm&r=g`,
  },
  meta: [],
}));

const body = JSON.stringify(publicUsers);

export const wordpressUsersApi: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
  });
};
