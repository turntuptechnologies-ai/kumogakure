import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for Joomla CVE-2023-23752 (Joomla 4.0.0–4.2.7): the web
// services API route `/api/index.php/v1/config/application` answers
// unauthenticated when called with `?public=true`, dumping the global
// configuration — DB host / user / password / name / prefix and mail
// settings — as JSON:API, one config key per `data[]` item with the
// component id 224. Scanners hit it to harvest DB credentials.
//
// Values match the `joomla-configuration-php` decoy so a scanner that
// collects both sees one coherent install. Secrets are non-actionable
// placeholders, hosts use `.invalid` (docs/RESPONSE_TEMPLATE_POLICY.md).
// `links` use the requesting host (not fabricated) and a fixed query, so
// nothing from the request beyond its origin is reflected.

const SETTINGS: [string, string | boolean | number][] = [
  ['offline', false],
  ['offline_message', 'This site is down for maintenance.<br>Please check back again soon.'],
  ['display_offline_message', 1],
  ['offline_image', ''],
  ['sitename', 'Example Site'],
  ['editor', 'tinymce'],
  ['captcha', '0'],
  ['list_limit', 20],
  ['access', 1],
  ['debug', false],
  ['debug_lang', false],
  ['debug_lang_const', true],
  ['dbtype', 'mysqli'],
  ['host', 'db.example.invalid'],
  ['user', 'app_user'],
  ['password', 'REDACTED_FOR_HONEYPOT'],
  ['db', 'example_joomla'],
  ['dbprefix', 'jos_'],
  ['dbencryption', 0],
  ['dbsslverifyservercert', false],
];

const PAGE_SIZE = 20;

export const joomlaApiConfigApplication: TemplateFn = (ctx) => {
  const base = `${new URL(ctx.request.url).origin}/api/index.php/v1/config/application?public=true`;
  const body = JSON.stringify({
    links: {
      self: base,
      next: `${base}&page%5Boffset%5D=${PAGE_SIZE}&page%5Blimit%5D=${PAGE_SIZE}`,
      last: `${base}&page%5Boffset%5D=60&page%5Blimit%5D=${PAGE_SIZE}`,
    },
    data: SETTINGS.map(([key, value]) => ({
      type: 'application',
      id: '224',
      attributes: { [key]: value, id: 224 },
    })),
    meta: { 'total-pages': 4 },
  });
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/vnd.api+json; charset=utf-8' },
  });
};
