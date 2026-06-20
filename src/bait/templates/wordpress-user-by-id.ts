import type { TemplateFn } from '../../types.js';
import { publicUsers } from './wordpress-users-api.js';

// Tier 1 decoy for the WordPress REST single-user endpoint
// (`wp-json/wp/v2/users/<id>`). After reading the `users` collection (or
// just guessing), scanners pull individual ids to confirm accounts and
// harvest the slug/display-name for credential stuffing — the gaps that
// triggered this showed an id sweep (3, 7, 8, 10). We mirror a real
// 3-user install: ids the collection advertises return that exact public
// record (coherent with `wordpress-users-api`); any other id gets WP's
// authentic `rest_user_invalid_id` 404. No auth leak, no email/password —
// the public response shape, never more.
//
// The served record is the SAME object the collection decoy exposes
// (imported `publicUsers`), so the two can't drift; the digest path is a
// `Map` lookup, so prototype-chain ids (`__proto__`, …) can't resolve.

const usersById = new Map(publicUsers.map((u) => [String(u.id), JSON.stringify(u)]));

const invalidId = JSON.stringify({
  code: 'rest_user_invalid_id',
  message: 'Invalid user ID.',
  data: { status: 404 },
});

const jsonHeaders = { 'Content-Type': 'application/json; charset=UTF-8' } as const;

// Mirrors the router pattern in `patterns.ts` (numeric id, any depth).
const ID_FROM_PATH = /\/wp-json\/wp\/v2\/users\/([0-9]+)$/;

export const wordpressUserById: TemplateFn = (ctx) => {
  const id = ID_FROM_PATH.exec(ctx.path)?.[1];
  const found = id !== undefined ? usersById.get(id) : undefined;
  if (found !== undefined) {
    return new Response(found, { status: 200, headers: jsonHeaders });
  }
  return new Response(invalidId, { status: 404, headers: jsonHeaders });
};
