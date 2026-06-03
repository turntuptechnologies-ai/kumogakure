import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for the user/member-enumeration REST routes that popular
// WordPress membership / LMS / community plugins register under their own
// `wp-json/<plugin>/<version>/` namespace — e.g. BuddyPress / BuddyBoss
// `/members`, LearnDash `ldlms/v2/users`, LearnPress `lp|learnpress`,
// Tutor LMS `/students`, Ultimate Member `um|ultimate-member`, PeepSo,
// Youzer, bbPress (`bbp-api`), WP User Frontend (`wpuf`). Like the core
// `wp/v2/users` endpoint, these leak the account list (id, display name,
// slug) without auth when left on the default permissions, which a
// credential-stuffing scanner harvests for follow-on brute force.
//
// Scanners spray the whole plugin set in one pass (one namespace after
// another); the router matches the allowlisted namespaces. We return a
// generic members list with the SAME fabricated accounts the core
// `wordpress-users-api` decoy serves, so a scanner that hits both sees a
// coherent roster and proceeds — which is what we capture. No real
// person, no password / email field.

const members = [
  { id: 1, name: 'Editorial Team', slug: 'editor' },
  { id: 2, name: 'Staff', slug: 'staff' },
  { id: 3, name: 'Marketing', slug: 'marketing' },
];

const placeholderAvatarHash = '0'.repeat(32);

const body = JSON.stringify(
  members.map((m) => ({
    id: m.id,
    name: m.name,
    slug: m.slug,
    link: `https://example.invalid/author/${m.slug}/`,
    avatar_urls: {
      '24': `https://secure.gravatar.com/avatar/${placeholderAvatarHash}?s=24&d=mm&r=g`,
      '48': `https://secure.gravatar.com/avatar/${placeholderAvatarHash}?s=48&d=mm&r=g`,
      '96': `https://secure.gravatar.com/avatar/${placeholderAvatarHash}?s=96&d=mm&r=g`,
    },
  })),
);

export const wordpressPluginUsers: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
  });
};
