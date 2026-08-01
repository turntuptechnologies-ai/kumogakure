import type { PatternEntry } from '../types.js';

export const patternBait: PatternEntry[] = [
  // Common phpMyAdmin directory aliases scanners spray — the bare dir
  // (`/pma/`, `/PMA/`, `/phpMyAdmin/`) and the login script under it
  // (`/pma/index.php`, `/phpMyAdmin-2/index.php`). Covers the hyphen /
  // version-suffixed spellings (`php-my-admin`, `phpmyadmin2`,
  // `phpMyAdmin-2`, …) plus `myadmin` / `mysqladmin`. The canonical
  // `/phpmyadmin/` is an explicit catalog entry (checked first); this
  // catches the rest, case-insensitively, serving the same login decoy.
  // Root-level dir name is the fingerprint.
  {
    pattern:
      /^\/(?:php-?my-?admin(?:[-_.]?\d[\d.]*)?|pma|myadmin|mysql-?admin)(?:\/(?:index\.php)?)?$/i,
    category: 'cms-auth',
    subcategory: 'phpmyadmin',
    template: 'phpmyadmin-login',
  },
  // Adminer's login script under a directory (`/adminer/adminer.php`,
  // `/admin/adminer.php`) at any depth. Root `/adminer.php` & `/adminer/`
  // are explicit catalog entries (checked first); this catches the nested
  // forms. Same adminer-login decoy.
  {
    pattern: /^\/(?:[^/]+\/)+adminer\.php$/,
    category: 'cms-auth',
    subcategory: 'adminer',
    template: 'adminer-login',
  },
  // WordPress `wp-content/debug.log` (WP_DEBUG_LOG left on in production),
  // at any depth. Distinct from the wp-content webshell `.php` pattern below
  // (`.log`, not executable) — this is a source/error disclosure decoy that
  // leaks web root, plugin/theme names, and DB structure.
  {
    pattern: /^\/(?:[^/]+\/)*wp-content\/debug\.log$/,
    category: 'config-leak',
    subcategory: 'wordpress',
    template: 'fake-wp-debug-log',
  },
  {
    pattern: /^\/wp-content\/.+\.(php|phtml)$/,
    category: 'webshell',
    subcategory: 'wp-content',
    template: 'not-found',
  },
  {
    pattern: /^\/wp-includes\/.+\.php$/,
    category: 'webshell',
    subcategory: 'wp-includes',
    template: 'not-found',
  },
  // WordPress installation fingerprint: wp-includes/wlwmanifest.xml
  // (the WordPress-generated Windows Live Writer manifest) at any
  // depth — scanners spray subdirectory prefixes to find WP installs.
  // Different ending from the wp-includes/*.php webshell pattern; no
  // overlap (regex-verified).
  {
    pattern: /^\/(?:[^/]+\/)*wp-includes\/wlwmanifest\.xml$/,
    category: 'cms-auth',
    subcategory: 'wordpress-fingerprint',
    template: 'fake-wlwmanifest',
  },
  // wp-includes/ID3/license.txt — the getID3 audio library WordPress
  // vendors; scanners read this file as a stable WP-installed
  // fingerprint (parallel to wlwmanifest.xml above). `\/+` allows
  // double-slash prefixes (`/blog//wp-includes/...`) which scanner
  // path-template bugs occasionally produce and Cloudflare does not
  // normalise.
  {
    pattern: /^\/(?:[^/]+\/+)*wp-includes\/ID3\/license\.txt$/,
    category: 'cms-auth',
    subcategory: 'wordpress-fingerprint',
    template: 'wordpress-id3-license',
  },
  // WordPress REST API `wp-json/wp/v2/users/` — public, unauthenticated
  // user enumeration when the default permissions are left on.
  // Returns slug + display name + bio for every user account, which
  // scanners then feed into credential-stuffing. Distinct subcategory
  // from `wordpress-fingerprint` because the threat model is user
  // enumeration, not version detection.
  // WordPress REST `wp-json/wp/v2/users/me` — the current-user endpoint.
  // Requires auth, so an unauthenticated probe gets a 401
  // `rest_not_logged_in`; scanners hammer it as a WP-REST fingerprint and
  // to spot leaked sessions / auth bypass. Matched ahead of the `users`
  // collection below (distinct `/me` suffix; the collection pattern ends
  // at `users/?$` and would not match anyway).
  {
    pattern: /^\/(?:[^/]+\/+)*wp-json\/wp\/v2\/users\/me$/,
    category: 'cms-auth',
    subcategory: 'wordpress-rest-users',
    template: 'wordpress-users-me',
  },
  {
    pattern: /^\/(?:[^/]+\/+)*wp-json\/wp\/v2\/users\/?$/,
    category: 'cms-auth',
    subcategory: 'wordpress-rest-users',
    template: 'wordpress-users-api',
  },
  // WordPress REST single-user endpoint `wp-json/wp/v2/users/<id>` (numeric
  // id). Scanners pull individual ids to confirm accounts and harvest the
  // slug/display-name for credential stuffing (the gap that triggered this
  // was an id sweep: 3, 7, 8, 10). Numeric-only id so it never overlaps the
  // `/me` route above or the `users/?$` collection. The decoy serves the
  // collection's own records for advertised ids and `rest_user_invalid_id`
  // otherwise.
  {
    pattern: /^\/(?:[^/]+\/+)*wp-json\/wp\/v2\/users\/[0-9]+$/,
    category: 'cms-auth',
    subcategory: 'wordpress-rest-users',
    template: 'wordpress-user-by-id',
  },
  // User/member enumeration via WordPress membership / LMS / community
  // plugins, which register their own `wp-json/<plugin>/<ver>/` routes:
  // BuddyPress / BuddyBoss / PeepSo / Youzer / Ultimate Member
  // (`um`|`ultimate-member`) `/members`, LearnDash (`ldlms`), LearnPress
  // (`lp`|`learnpress`), WP User Frontend (`wpuf`), bbPress (`bbp-api`)
  // `/users`, and Tutor LMS `/students`. Same default-permissions account
  // leak as core `wp/v2/users`, so the same threat model / subcategory.
  // Namespace allowlist (not a wildcard) to avoid matching unrelated
  // plugin routes; `[^/]+\/+` prefix mirrors the core pattern's any-depth
  // handling (e.g. `/blog/wp-json/...`).
  {
    pattern:
      /^\/(?:[^/]+\/+)*wp-json\/(?:tutor|ldlms|bbp-api|youzer|peepso|wpuf|lp|learnpress|buddyboss|buddypress|um|ultimate-member)\/v[0-9]+\/(?:users|members|students)\/?$/,
    category: 'cms-auth',
    subcategory: 'wordpress-rest-users',
    template: 'wordpress-plugin-users',
  },
  // WooCommerce REST API customer collection (`wp-json/wc/v<n>/customers`,
  // v1-v3, any depth). Unlike the plugin user-directory routes above —
  // which leak a public member list on default permissions — WooCommerce
  // list endpoints are authenticated, so an anonymous probe gets a
  // `401 woocommerce_rest_cannot_view`. Distinct subcategory: the threat
  // is customer-PII enumeration / leaked-API-key probing, and the decoy
  // is a 401 (not a roster), so it must not fold into wordpress-plugin-users.
  {
    pattern: /^\/(?:[^/]+\/+)*wp-json\/wc\/v[0-9]+\/customers\/?$/,
    category: 'cms-auth',
    subcategory: 'woocommerce',
    template: 'woocommerce-customers',
  },
  // MemberPress (Developer Tools) REST member collection
  // (`wp-json/mepr/v<n>/members`). Gated by a `MEMBERPRESS-API-KEY`
  // permission check; anonymous probes get the WP-core `401 rest_forbidden`.
  // Same auth-gated PII-enumeration threat as WooCommerce above (member
  // email/membership rather than a public roster), so a separate 401 decoy
  // rather than the plugin-users list.
  {
    pattern: /^\/(?:[^/]+\/+)*wp-json\/mepr\/v[0-9]+\/members\/?$/,
    category: 'cms-auth',
    subcategory: 'memberpress',
    template: 'memberpress-members',
  },
  // Rank Math SEO REST route `wp-json/rankmath/v<n>/getHead`. The endpoint
  // fetches an attacker-supplied `?url=` server-side to return its `<head>`
  // markup — an SSRF / open-proxy surface (reach internal services / cloud
  // metadata). Product-specific security-relevant endpoint, so cve-recon
  // (not cms-auth). The decoy never fetches; it mirrors the `url`-absent
  // response (`400 rest_missing_callback_param`) and the honeypot captures
  // the probe + any `?url=` payload. Route name is case-sensitive in WP.
  {
    pattern: /^\/(?:[^/]+\/+)*wp-json\/rankmath\/v[0-9]+\/getHead\/?$/,
    category: 'cve-recon',
    subcategory: 'rankmath',
    template: 'rankmath-gethead',
  },
  // WordPress user-enumeration sitemaps: core (5.5+) paginated user
  // sitemap `/wp-sitemap-users-<n>.xml`. Lists one `/author/<slug>/` URL
  // per account — the same username-slug leak as `wp/v2/users`, via XML.
  // The Yoast/Rank Math `/author-sitemap.xml` equivalent is an explicit
  // catalog entry (fixed name). Both serve the wordpress-user-sitemap decoy.
  {
    pattern: /^\/wp-sitemap-users-[0-9]+\.xml$/,
    category: 'cms-auth',
    subcategory: 'wordpress-user-sitemap',
    template: 'wordpress-user-sitemap',
  },
  // WordPress core REST content collections (`wp-json/wp/v2/<type>`):
  // posts, pages, comments, media, categories, tags. Public on default
  // permissions; leak content and (posts/media) the authoring user id.
  // Allowlisted collection names; the template serves a small plausible
  // set per type and `[]` otherwise.
  {
    pattern: /^\/(?:[^/]+\/+)*wp-json\/wp\/v2\/(?:posts|pages|comments|media|categories|tags)\/?$/,
    category: 'cms-auth',
    subcategory: 'wordpress-rest-content',
    template: 'wordpress-rest-content',
  },
  // WordPress REST API index at `wp-json/` (and bare `wp-json`) — the
  // discovery endpoint scanners hit first to confirm WP REST and learn
  // the namespaces/routes. Matches only the index itself (nothing after
  // `wp-json`), so it never shadows the specific routes above.
  {
    pattern: /^\/(?:[^/]+\/+)*wp-json\/?$/,
    category: 'cms-auth',
    subcategory: 'wordpress-fingerprint',
    template: 'wordpress-rest-root',
  },
  // WordPress REST API `wp-json/oembed/1.0/embed` — fingerprint probe
  // that records "WP REST is reachable". Real WP returns 400 with
  // `rest_missing_callback_param` when `?url=` is absent, which is the
  // shape our template mirrors.
  {
    pattern: /^\/(?:[^/]+\/+)*wp-json\/oembed\/1\.0\/embed$/,
    category: 'cms-auth',
    subcategory: 'wordpress-fingerprint',
    template: 'wordpress-oembed',
  },
  {
    pattern: /^\/.*\.(bak|swp|old|orig|save|backup)$/,
    category: 'config-leak',
    subcategory: 'backup',
    template: 'not-found',
  },
  // Editor-backup tilde-suffixed files (emacs/vi save a copy as
  // `foo.bar~`). Parallel convention to the extension-based backup
  // pattern above. Anything ending in `~` after at least one path
  // character is treated as a backup probe — same disposition.
  {
    pattern: /^\/.+~$/,
    category: 'config-leak',
    subcategory: 'backup',
    template: 'not-found',
  },
  // Site-archive sweep — `backup.tar.gz`, `public_html.tar.gz`, `site.zip`,
  // `web.zip`, and the rest of the "someone left the release tarball in the
  // web root" family. Deliberately Tier 3 (`not-found`): serving a real
  // archive would violate docs/RESPONSE_TEMPLATE_POLICY.md §A.4, which bars
  // returning anything that could exploit a decompression bug in whatever
  // unpacks it. The entry exists so these land in `config-leak/site-archive`
  // in the rollups instead of `unknown` — the same disposition, and the same
  // reasoning, as the `.bak`/`.swp` backup family above.
  //
  // Matched on the archive extension alone, at any depth and any basename:
  // there is no legitimate archive to shadow on a honeypot, so an extension
  // match carries no false-positive cost and generalises past whichever
  // basenames a given campaign happens to try. Compound extensions need no
  // special case — `.tar.gz` ends in `.gz`, `.tar.bz2` ends in `.bz2`.
  {
    pattern: /^\/(?:[^/]+\/)*[^/]+\.(?:zip|rar|7z|tar|tgz|tbz2?|txz|gz|bz2|xz|zst)$/i,
    category: 'config-leak',
    subcategory: 'site-archive',
    template: 'not-found',
  },
  // Database dumps left in the web root — `/database.sql`, `/backup.sql`,
  // `/dump.sql`, `/db_backup.sql`, `/backup/dump.sql`, `/wp-content/mysql.sql`,
  // … (CWE-200 / CWE-538). A retrievable dump is the highest-engagement
  // disclosure in this class: the scanner that pulls one acts on what is
  // inside it, and that follow-up is the behaviour worth capturing.
  //
  // Matched on the `.sql` extension at any depth rather than a basename
  // allowlist — same reasoning as the archive entry above (no legitimate
  // `.sql` to shadow, and campaigns rotate the basenames). Ordered *after*
  // the archive pattern so a compressed dump (`backup.sql.gz`) correctly
  // takes the Tier 3 404 rather than being served this SQL text.
  {
    pattern: /^\/(?:[^/]+\/)*[^/]+\.sql$/i,
    category: 'config-leak',
    subcategory: 'sql-dump',
    template: 'fake-sql-dump',
  },
  {
    pattern: /^\/\.env\..+$/,
    category: 'config-leak',
    subcategory: 'dotenv-variant',
    template: 'fake-env',
  },
  // Scanners spray `.env` across many directories (/api/.env,
  // /backend/.env, ...), not just the web root. This pattern requires
  // the final path segment to be exactly `.env`; named env files like
  // `aws.env` are picked up by the `<name>.env` pattern further down.
  // Root /.env stays on the explicit catalog entry (checked first);
  // root /.env.<x> stays on the pattern above (earlier, first-match
  // wins) — both unchanged.
  {
    pattern: /^\/(?:[^/]+\/)*\.env$/,
    category: 'config-leak',
    subcategory: 'dotenv',
    template: 'fake-env',
  },
  // Vite dev-server internal routes (/@fs/, /@id/, /@vite/) exposed in
  // production are the attack surface of the file-read CVE family
  // (CVE-2025-30208 trailing-separator bypass, CVE-2025-31125
  // ?import+?raw/?inline bypass). Classify as cve-recon rather than the
  // dotenv-variant pattern below that the basename would otherwise hit
  // (e.g. /@fs/.env.test). Template still serves fake-env so the bait
  // remains engaging; query strings (?raw, ?import, ?raw??) are not
  // matched here because routing is path-only.
  {
    pattern: /^\/@(?:fs|id|vite)(?:\/.*)?$/,
    category: 'cve-recon',
    subcategory: 'vite-fs-traversal',
    template: 'fake-env',
  },
  {
    pattern: /^\/(?:[^/]+\/)*\.env\.[^/]+$/,
    category: 'config-leak',
    subcategory: 'dotenv-variant',
    template: 'fake-env',
  },
  // Named env files — a non-empty basename ending in `.env`
  // (aws.env, prod.env, staging.env, ...). Distinct from the bare
  // `.env` patterns above; verified not to match `/.env`,
  // `/.env.production`, or `.env-config.js`.
  {
    pattern: /^\/(?:[^/]+\/)*[^/]+\.env$/,
    category: 'config-leak',
    subcategory: 'dotenv-variant',
    template: 'fake-env',
  },
  // Manual-copy / numbered env-file variants (.env1, .env2, .env_copy,
  // .env_backup, ...). The `.env` literal must be followed by a digit
  // or underscore — verified not to match `.env`, `.env.production`,
  // `.environment`, or `.env~` (latter goes to the tilde-backup
  // pattern above).
  {
    pattern: /^\/(?:[^/]+\/)*\.env[0-9_].*$/,
    category: 'config-leak',
    subcategory: 'dotenv-variant',
    template: 'fake-env',
  },
  // Dotless env templates — `env.example`, `env.sample`, `env.dist`,
  // `env-template`, `env_local`, … at any depth. The `.env.<suffix>` pattern
  // above only covers the leading-dot spelling (`.env.example`), so the
  // equally common dotless form was falling through. Same disclosure class,
  // and the reason scanners want it is that the "template" file is routinely
  // committed with the real values still in it.
  //
  // The suffix list is a closed allowlist so this cannot swallow unrelated
  // basenames, and every alternative is anchored at end-of-string — `env.js`
  // and `env.prod.js` therefore stay with the js-config decoy below, and
  // `env.json` stays with the JSON-config decoy.
  {
    pattern:
      /^\/(?:[^/]+\/)*env[-_.](?:example|sample|template|dist|default|local|dev|development|prod|production|staging|test)$/i,
    category: 'config-leak',
    subcategory: 'dotenv-variant',
    template: 'fake-env',
  },
  // direnv's `.envrc` at any depth — the `export`-form sibling of the `.env`
  // family. Its own subcategory and template because it is a distinct
  // product with a distinct file shape: direnv evaluates `.envrc` as shell,
  // so a real one mixes `export` assignments with `layout` / `dotenv_if_exists`
  // / `PATH_add` directives rather than reading as a flat KEY=value list.
  // Worth covering separately from `.env` because `.envrc` is far less often
  // in a project's .gitignore, so it leaks more.
  {
    pattern: /^\/(?:[^/]+\/)*\.envrc$/,
    category: 'config-leak',
    subcategory: 'direnv',
    template: 'fake-envrc',
  },
  // CakePHP DebugKit `_environment` endpoint, exposed in production
  // dumps $_ENV. Covers the bare `/_environment` and the CakePHP-
  // routed `/webroot/index.php/_environment` shape. Template reuses
  // `fake-env` since the response is essentially an env dump.
  {
    pattern: /^\/(?:webroot\/index\.php\/)?_environment$/,
    category: 'config-leak',
    subcategory: 'cakephp-debugkit',
    template: 'fake-env',
  },
  // Front-end runtime-config / env JavaScript that SPAs ship — `config.js`
  // and `env[.<environment>].js` at the root or under js/static/api/...
  // dirs — routinely embed backend URLs and API keys in cleartext.
  // Scanners sweep the well-known names looking for harvestable secrets.
  // The any-depth `[^/]+\/+` prefix also covers the `..;/`-traversal forms
  // (`/..;/env.js`) that bypass servlet path normalisation, since `..;`
  // is a normal non-slash segment to URL parsing. Served the fake-js-config
  // decoy (non-actionable decoy secrets).
  {
    pattern: /^\/(?:[^/]+\/+)*config\.js$/,
    category: 'config-leak',
    subcategory: 'js-config',
    template: 'fake-js-config',
  },
  {
    pattern: /^\/(?:[^/]+\/+)*env(?:\.[a-z]+)?\.js$/,
    category: 'config-leak',
    subcategory: 'js-config',
    template: 'fake-js-config',
  },
  // App runtime-config JSON that SPAs/services ship — `config.json`,
  // `config.<env>.json`, `configuration.json`, `configs.json`,
  // `settings.json`, `production.json`, `env.json`, at any depth (root,
  // `assets/`, …). The JSON sibling of the config.js / env.js sweep above
  // (`env` closes the asymmetry with the `env.js` pattern); scanners spray
  // the well-known names for cleartext backend URLs / API keys. Basename
  // allowlist keeps it off unrelated `.json` (package.json, composer.json,
  // swagger.json, appsettings.json all have their own earlier entries and
  // are not in this set). Served the fake-json-config decoy.
  {
    pattern:
      /^\/(?:[^/]+\/)*(?:configuration|configs?|settings|production|env)(?:\.(?:prod|production|dev|development|local|staging|test|default))?\.json$/i,
    category: 'config-leak',
    subcategory: 'js-config',
    template: 'fake-json-config',
  },
  // FTP/SFTP deploy-credential config files — scanners spray dozens of
  // naming/extension variants hunting for host/user/password in cleartext
  // (CWE-200 / CWE-538). Two patterns cover the family (case-insensitive
  // for `FTP.json` / `Sftp.json` etc.):
  //   1. an ftp/sftp(/ftps) basename — with optional `app.` / `project.` /
  //      `_` / `.` prefixes and `-config` / `.settings` / `.dev` / `-v1` /
  //      … qualifiers — ending in a config extension, plus a trailing
  //      `.template` / `.dist` / `.example` / `.bak<n>` etc.
  //   2. extensionless bare names (`ftpconfig`, `sftpsettings`) and rc /
  //      dotfile forms (`.ftprc`, `.sftpconfig`).
  // Served the fake-ftp-config decoy (format-appropriate fake creds,
  // reusing the .vscode/sftp.json values).
  {
    pattern:
      /^\/(?:[^/]+\/)*[._]?(?:[a-z0-9]+[._-])*s?ftps?(?:[._-][a-z0-9]+)*\.(?:json|js|ya?ml|xml|ini|conf|config|txt)(?:\.(?:template|default|dist|example|bak\d*))?$/i,
    category: 'config-leak',
    subcategory: 'ftp-credentials',
    template: 'fake-ftp-config',
  },
  {
    pattern: /^\/(?:[^/]+\/)*(?:\.s?ftps?(?:config|rc)?|s?ftps?(?:config|settings))$/i,
    category: 'config-leak',
    subcategory: 'ftp-credentials',
    template: 'fake-ftp-config',
  },
  // MCP servers (JSON-RPC 2.0 over the Streamable HTTP transport) are
  // mounted at varied paths; scanners enumerate the common ones. /mcp
  // itself is the explicit catalog entry (checked first); these cover
  // the rest. /jsonrpc is generic JSON-RPC but routed here too — the
  // template returns a JSON-RPC error for non-MCP bodies.
  {
    pattern: /^\/(?:jsonrpc|sse|messages)$/,
    category: 'mcp-recon',
    subcategory: 'mcp',
    template: 'mcp',
  },
  {
    pattern: /^\/(?:api\/)?mcp(?:\/.*)?$/,
    category: 'mcp-recon',
    subcategory: 'mcp',
    template: 'mcp',
  },
  // phpinfo() enumeration: a curated allowlist of the basenames
  // scanners spray, at any directory depth. Generic names like
  // index.php / contact.php are deliberately excluded; wp-content
  // and wp-includes .php stay webshell via the earlier patterns
  // (first-match wins).
  {
    // Leading `[0-9._-]*` and trailing `s?` + the `i` flag absorb the
    // name-fuzzing scanners spray around the core probe names (`5info.php`,
    // `_info.php`, `02-info.php`, `0.0_phpinfo.php`, `00_server_info.php`,
    // `infos.php`, `1_1_PhpInfo.php`, …). The prefix class is digits/dots/
    // underscores/hyphens only, so alphabetic lookalikes (`userinfo.php`) do
    // NOT get absorbed.
    pattern:
      /^\/(?:[^/]+\/)*[0-9._-]*(?:phpinfo|_phpinfo|old_phpinfo|phpversion|php-version|php_version|php-info|php_info|php|pinfo|pi|p|i|info|test|debug|server-status|server_status|server-info|server_info)s?\.php$/i,
    category: 'config-leak',
    subcategory: 'phpinfo',
    template: 'phpinfo',
  },
  {
    pattern:
      /^\/(?:[^/]+\/)*(?:phpinfo|php-info|php_info|phpversion|php-version|php_version|info)$/,
    category: 'config-leak',
    subcategory: 'phpinfo',
    template: 'phpinfo',
  },
  // ownCloud graphapi phpinfo disclosure — CVE-2023-49103. The bundled
  // microsoft-graph test script `…/tests/GetPhpInfo.php` calls phpinfo()
  // pre-auth, leaking env vars (which on the ownCloud Docker image carry
  // admin creds, mail, S3/object-store keys). Mass-exploited. Optional
  // `owncloud/` prefix covers both the root and subdir mount points
  // scanners try. Reuses the phpinfo decoy — exactly what the CVE leaks.
  {
    pattern:
      /^\/(?:owncloud\/)?apps\/graphapi\/vendor\/microsoft\/microsoft-graph\/tests\/GetPhpInfo\.php$/,
    category: 'cve-recon',
    subcategory: 'owncloud',
    template: 'phpinfo',
  },
  // Nextcloud AppAPI exApp-proxy `get_log_file` arbitrary file read — the
  // log path is unsanitised, so `..%252f`-style (often multiply-encoded, e.g.
  // `..%25252f`) traversal escapes to any file; scanners target `/etc/passwd`.
  // `URL.pathname` preserves the percent-encoding, so we match the AppAPI
  // proxy `get_log_file` fingerprint followed by a `passwd`-terminated
  // traversal, and serve a believable /etc/passwd (leaks nothing real).
  {
    pattern: /^\/(?:index\.php\/)?apps\/app_api\/proxy\/.+\/get_log_file\/.+passwd$/i,
    category: 'cve-recon',
    subcategory: 'nextcloud',
    template: 'fake-etc-passwd',
  },
  // PHPUnit `eval-stdin.php` pre-auth RCE — CVE-2017-9841. The bundled
  // test helper evaluates the POST body as PHP. Canonical path is
  // `vendor/phpunit/phpunit/src/Util/PHP/eval-stdin.php`, but scanners
  // hit it under varied roots (`/lib/`, nested vendor dirs), so anchor on
  // `phpunit/…/eval-stdin.php` at any depth. The decoy returns an empty
  // 200 (executes nothing); the honeypot still captures the POSTed payload.
  {
    pattern: /^\/(?:[^/]+\/+)*phpunit\/(?:[^/]+\/+)*eval-stdin\.php$/,
    category: 'cve-recon',
    subcategory: 'phpunit',
    template: 'phpunit-eval-stdin',
  },
  // Git home-dir dotfiles at any depth (/root/, /home/<user>/, web
  // root). Distinct from the .git/ repo family below; final segment
  // must be exactly the dotfile name. .git-credentials is split to its
  // own subcategory — plaintext credential theft is a higher-severity
  // signal worth isolating in the daily_stats rollups.
  {
    pattern: /^\/(?:[^/]+\/)*\.gitconfig$/,
    category: 'config-leak',
    subcategory: 'git',
    template: 'fake-gitconfig',
  },
  {
    pattern: /^\/(?:[^/]+\/)*\.git-credentials$/,
    category: 'config-leak',
    subcategory: 'git-credentials',
    template: 'fake-git-credentials',
  },
  // Cloud credential/config dotfiles at any depth. Same severity split
  // as the git family: plaintext credential stores
  // (.aws/credentials, .s3cfg, .boto) go to `cloud-credentials`;
  // .aws/config is structural so it stays `aws`. The old exact
  // /.aws/credentials catalog entry was removed in favour of these.
  {
    pattern: /^\/(?:[^/]+\/)*\.aws\/credentials$/,
    category: 'config-leak',
    subcategory: 'cloud-credentials',
    template: 'fake-aws-credentials',
  },
  {
    pattern: /^\/(?:[^/]+\/)*\.s3cfg$/,
    category: 'config-leak',
    subcategory: 'cloud-credentials',
    template: 'fake-s3cfg',
  },
  {
    pattern: /^\/(?:[^/]+\/)*\.boto$/,
    category: 'config-leak',
    subcategory: 'cloud-credentials',
    template: 'fake-boto',
  },
  {
    pattern: /^\/(?:[^/]+\/)*\.aws\/config$/,
    category: 'config-leak',
    subcategory: 'aws',
    template: 'fake-aws-config',
  },
  // AWS keys persisted as JSON (`aws-credentials.json` / `aws_credentials.json`)
  // at any depth — the SDK-style camelCase counterpart to the INI
  // `.aws/credentials` store above. Same credential-theft class. The basename
  // `aws-credentials` is not in the GCP `*.json` allowlist below, so it would
  // otherwise fall through to unknown; served the JSON-shaped AWS-creds decoy.
  {
    pattern: /^\/(?:[^/]+\/)*aws[-_]credentials\.json$/,
    category: 'config-leak',
    subcategory: 'cloud-credentials',
    template: 'fake-aws-credentials-json',
  },
  // GCP service-account JSON key files. Operators routinely commit
  // these under varied basenames (keyfile.json, service-account.json,
  // firebase-adminsdk.json, application_default_credentials.json, …).
  // `serviceAccountKey` / `serviceAccount` are the camelCase spellings —
  // the name the Firebase console gives an Admin SDK private key on
  // download, and consequently the most-committed one. Final segment must
  // match a known basename + `.json`; any depth. Same credential-theft
  // class as the .aws/* and .git-credentials family, so this is
  // `cloud-credentials` subcategory.
  {
    pattern:
      /^\/(?:[^/]+\/)*(?:keyfile|key|google-key|firebase-key|firebase-adminsdk|service-account|serviceAccountKey|serviceAccount|sa|google-credentials|gcp-sa|gcp-key|gcp-credentials|credentials|application_default_credentials)\.json$/,
    category: 'config-leak',
    subcategory: 'cloud-credentials',
    template: 'fake-gcp-service-account-key',
  },
  // .netrc / _netrc (Windows): plaintext auto-login store for curl /
  // wget / git-over-HTTPS / ftp. Same credential-theft class as the
  // git/cloud stores; any depth, final segment exact.
  {
    pattern: /^\/(?:[^/]+\/)*[._]netrc$/,
    category: 'config-leak',
    subcategory: 'netrc',
    template: 'fake-netrc',
  },
  // Package-registry publish credentials -> supply-chain. .npmrc
  // carries the npm _authToken; .pypirc the PyPI API token. One shared
  // subcategory (the supply-chain token-theft signal); any depth,
  // final segment exact.
  {
    pattern: /^\/(?:[^/]+\/)*\.npmrc$/,
    category: 'config-leak',
    subcategory: 'package-registry-credentials',
    template: 'fake-npmrc',
  },
  {
    pattern: /^\/(?:[^/]+\/)*\.pypirc$/,
    category: 'config-leak',
    subcategory: 'package-registry-credentials',
    template: 'fake-pypirc',
  },
  // Login-shell rc files at any depth — swept when a web root is
  // misconfigured to sit inside a home directory, or when a traversal has
  // already landed the scanner there. Same home-dir dotfile family as
  // `.netrc` / `.gitconfig` / `.npmrc` above, and the same reason: an rc file
  // is where an operator exports the credentials they want available at an
  // interactive prompt — registry tokens, cloud keys, `PGPASSWORD` —
  // because that beats reaching for a keyring (CWE-200 / CWE-798). Closed
  // filename allowlist, final segment exact.
  {
    pattern:
      /^\/(?:[^/]+\/)*\.(?:bashrc|bash_profile|bash_login|bash_logout|bash_aliases|profile|zshrc|zprofile|zshenv|zlogin|kshrc|cshrc|tcshrc|login)$/,
    category: 'config-leak',
    subcategory: 'shell-rc',
    template: 'fake-shell-rc',
  },
  // Shell / client history files — the higher-value half of the same family,
  // so its own subcategory: an rc file discloses what an operator configured,
  // a history file discloses what they actually ran, including any password
  // passed on a command line (`mysql -p…`) and the hosts it was passed to
  // (CWE-200 / CWE-532). Covers the shell histories and the database/REPL
  // client histories that sit beside them.
  {
    pattern:
      /^\/(?:[^/]+\/)*\.(?:bash_history|zsh_history|sh_history|ksh_history|history|mysql_history|psql_history|python_history|node_repl_history|rediscli_history)$/,
    category: 'config-leak',
    subcategory: 'shell-history',
    template: 'fake-shell-history',
  },
  // Spring Boot `application.yml` / `application.yaml`. Scanners hit
  // it at every plausible classpath depth (`/application.yml`,
  // `/config/application.yml`, `/src/main/resources/application.yml`,
  // `/BOOT-INF/classes/application.yml`, …) when a fat JAR is
  // mis-served as static files. `spring.datasource.*` and security
  // secrets leak in cleartext.
  {
    pattern: /^\/(?:[^/]+\/)*application\.ya?ml$/,
    category: 'config-leak',
    subcategory: 'spring-config',
    template: 'spring-application-yml',
  },
  // Symfony 2.x / 3.x `parameters.yml` — DB credentials, mailer SMTP
  // credentials, and the app-wide `secret`. Probed at the canonical
  // `/app/config/parameters.yml` (legacy 2.x), `/config/parameters.yml`
  // (3.x), and the bare `/parameters.yml`.
  {
    pattern: /^\/(?:[^/]+\/)*parameters\.ya?ml$/,
    category: 'config-leak',
    subcategory: 'symfony-config',
    template: 'symfony-parameters-yml',
  },
  // Symfony Web Profiler exposed in production through a shipped dev
  // front controller. The profiler lives at `/_profiler` relative to the
  // front controller, so scanners spray it under the dev controller
  // (`app_dev.php`) and the public dir prefix (`web/`, `public/`):
  // `/_profiler`, `/_profiler/open`, `/app_dev.php/_profiler`,
  // `/web/app_dev.php/_profiler/open`, … Leaks request/session/env/DB
  // data (CWE-200 + CWE-489); the `open` action also reads source files.
  // Distinct subcategory from `symfony-config` (parameters.yml) — this is
  // the debug-interface surface, parallel to laravel-telescope / yii2-debug.
  {
    pattern: /^\/(?:(?:web|public)\/)?(?:(?:app_dev|app|index)\.php\/)?_profiler(?:\/.*)?$/,
    category: 'cve-recon',
    subcategory: 'symfony-profiler',
    template: 'symfony-profiler',
  },
  // `docker-compose.yml` and its per-environment overrides
  // (`docker-compose.override.yml`, `.prod.yml`, `.staging.yml`, …).
  // `environment:` blocks routinely carry plaintext DATABASE_URL,
  // JWT_SECRET, REDIS_PASSWORD, Postgres credentials, etc.
  {
    pattern:
      /^\/(?:[^/]+\/)*docker-compose(?:\.(?:override|local|dev|development|prod|production|staging|test))?\.ya?ml$/,
    category: 'config-leak',
    subcategory: 'docker-compose',
    template: 'docker-compose-yml',
  },
  // GitLab CI/CD pipeline config `.gitlab-ci.yml` at any depth. Scanners
  // pull it (CWE-200) to map the deploy topology — internal registry
  // hosts, image names, deploy targets — and to catch inlined secrets.
  // Distinct from the .git* metadata dotfiles (that family is git repo
  // state; this is CI config), so its own subcategory.
  {
    pattern: /^\/(?:[^/]+\/)*\.gitlab-ci\.ya?ml$/,
    category: 'config-leak',
    subcategory: 'gitlab-ci',
    template: 'fake-gitlab-ci',
  },
  // GitHub Actions workflow definitions under `.github/workflows/`, at any
  // depth. The GitHub sibling of `.gitlab-ci.yml` above and the same CWE-200
  // class — deploy topology, registry hosts, environment names, and any
  // secret inlined instead of referenced through `secrets.*`. Matched on the
  // directory, not on the filename, so it is not tied to the `deploy.yml`
  // spelling scanners happen to try first (`ci.yml`, `release.yaml`, …).
  // Own subcategory: distinct product from GitLab CI, and distinct from the
  // `.git*` repo-metadata family further down (which never matches
  // `.github/` — `\.git\/` cannot span the `hub` in `.github/`).
  {
    pattern: /^\/(?:[^/]+\/)*\.github\/workflows\/[^/]+\.ya?ml$/,
    category: 'config-leak',
    subcategory: 'github-actions',
    template: 'fake-github-workflow',
  },
  // The rest of the YAML CI/CD pipeline products, swept in one batch
  // alongside `.gitlab-ci.yml` and `.github/workflows/*` above and carrying
  // the same CWE-200 payload — deploy topology, internal registry hosts,
  // environment names, and whatever secret was inlined instead of referenced
  // through the product's masked-variable mechanism.
  //
  // One subcategory per product (the taxonomy rule: category = activity,
  // subcategory = product), all served by `fake-ci-pipeline`, which selects
  // the product-correct document from the matched subcategory. Serving one
  // generic YAML shape for all six would read wrong to a scanner that parses
  // what it fetched: these schemas have nothing in common at the top level.
  {
    pattern: /^\/(?:[^/]+\/)*\.travis\.ya?ml$/,
    category: 'config-leak',
    subcategory: 'travis-ci',
    template: 'fake-ci-pipeline',
  },
  {
    pattern: /^\/(?:[^/]+\/)*\.circleci\/config\.ya?ml$/,
    category: 'config-leak',
    subcategory: 'circleci',
    template: 'fake-ci-pipeline',
  },
  {
    pattern: /^\/(?:[^/]+\/)*\.drone\.ya?ml$/,
    category: 'config-leak',
    subcategory: 'drone-ci',
    template: 'fake-ci-pipeline',
  },
  {
    pattern: /^\/(?:[^/]+\/)*bitbucket-pipelines\.ya?ml$/,
    category: 'config-leak',
    subcategory: 'bitbucket-pipelines',
    template: 'fake-ci-pipeline',
  },
  // Buildkite keeps its pipeline under `.buildkite/`, so — like the
  // `.github/workflows/` entry — this matches on the directory rather than
  // on the `pipeline.yml` spelling a given repo happens to use.
  {
    pattern: /^\/(?:[^/]+\/)*\.buildkite\/[^/]+\.ya?ml$/,
    category: 'config-leak',
    subcategory: 'buildkite',
    template: 'fake-ci-pipeline',
  },
  // Azure Pipelines is committed as `azure-pipelines.yml` at the root, but
  // the dot-prefixed spelling and the multi-pipeline suffix form
  // (`azure-pipelines.release.yml`) are both in the wild.
  {
    pattern: /^\/(?:[^/]+\/)*\.?azure-pipelines(?:\.[^./]+)?\.ya?ml$/,
    category: 'config-leak',
    subcategory: 'azure-pipelines',
    template: 'fake-ci-pipeline',
  },
  // Jenkins pipelines are Groovy, not YAML, so they get their own decoy
  // rather than a branch of `fake-ci-pipeline`. Case-insensitive because
  // both `Jenkinsfile` and `jenkinsfile` are sprayed, and the optional
  // suffix covers the multibranch convention (`Jenkinsfile.release`).
  {
    pattern: /^\/(?:[^/]+\/)*jenkinsfile(?:\.[^/]+)?$/i,
    category: 'config-leak',
    subcategory: 'jenkins',
    template: 'fake-jenkinsfile',
  },
  // Build/deploy artifacts scanners sweep in the same batch as the CI
  // configs, on the hypothesis that the whole repo is being served as static
  // files. Each is a real disclosure in its own right: a Dockerfile pins base
  // images (CVE-matching input) and is where build-time secrets get baked in
  // via ARG/ENV; a Makefile's variable block names the registry, deploy host,
  // and database; `app.yaml`'s `env_variables:` is where App Engine runtime
  // secrets live. `Procfile` carries no secrets but discloses the process
  // model — it is here for coherence, since a host that answers Dockerfile
  // and Makefile but 404s Procfile is inconsistent.
  {
    pattern: /^\/(?:[^/]+\/)*dockerfile(?:\.[^/]+)?$/i,
    category: 'config-leak',
    subcategory: 'dockerfile',
    template: 'fake-dockerfile',
  },
  {
    pattern: /^\/(?:[^/]+\/)*(?:gnu)?makefile$/i,
    category: 'config-leak',
    subcategory: 'makefile',
    template: 'fake-makefile',
  },
  {
    pattern: /^\/(?:[^/]+\/)*procfile(?:\.[^/]+)?$/i,
    category: 'config-leak',
    subcategory: 'procfile',
    template: 'fake-procfile',
  },
  // App Engine service descriptor. Exactly `app.yaml` / `app.yml` — Spring's
  // `application.ya?ml` is a different product with its own decoy above and
  // does not overlap (the basename must be `app`, not `application`).
  {
    pattern: /^\/(?:[^/]+\/)*app\.ya?ml$/,
    category: 'config-leak',
    subcategory: 'gae-app-yaml',
    template: 'fake-gae-app-yaml',
  },
  // Deploy / release shell scripts — the highest-value member of this family
  // after the CI configs. A deploy script names the target hosts, the SSH key
  // path, the rsync layout, and the registry, and it is where a password most
  // often ends up hardcoded rather than read from the environment (CWE-200 /
  // CWE-798). Closed basename allowlist so this stays off arbitrary `.sh`.
  {
    pattern:
      /^\/(?:[^/]+\/)*(?:deploy|deployment|release|publish|install|setup|build|start|run|(?:docker-)?entrypoint)\.(?:sh|bash)$/i,
    category: 'config-leak',
    subcategory: 'deploy-script',
    template: 'fake-deploy-script',
  },
  // Terraform variable-definition files at any depth — `terraform.tfvars`,
  // `prod.tfvars`, `*.auto.tfvars`, and the `.tfvars.json` form. Convention
  // puts exactly the values that must stay out of version control here (DB
  // passwords, cloud credentials, API tokens), which is why every published
  // Terraform .gitignore lists it and why scanners sweep for it when a repo
  // or build directory is served as static files. The `.tfvars` extension is
  // Terraform-specific, so a bare extension match carries no false-positive
  // risk. `terraform.tfstate` is deliberately NOT covered here (not observed;
  // it needs its own JSON decoy, not this HCL one).
  {
    pattern: /^\/(?:[^/]+\/)*[^/]+\.tfvars(?:\.json)?$/,
    category: 'config-leak',
    subcategory: 'terraform',
    template: 'fake-terraform-tfvars',
  },
  // Serverless Framework service definition `serverless.yml` / `.yaml` at any
  // depth. `provider.environment` is the idiomatic place to put runtime
  // config, so real services routinely leave plaintext database URLs and API
  // keys in it; the IAM statements, queue/table/bucket ARNs, and handler list
  // additionally map the deployment. Same disclosure class as the
  // docker-compose / spring-config entries, own product subcategory.
  {
    pattern: /^\/(?:[^/]+\/)*serverless\.ya?ml$/,
    category: 'config-leak',
    subcategory: 'serverless-framework',
    template: 'serverless-yml',
  },
  // Django `settings.py` at any depth (e.g. `/settings.py`,
  // `/<project>/settings.py`, `/config/settings.py`). Exposes
  // `SECRET_KEY`, `DATABASES['default']`, and `EMAIL_HOST_PASSWORD`
  // when served as source. CWE-200 / CWE-538 disclosure class.
  // The split-settings convention (`base_settings.py` +
  // `local_settings.py` / `prod_settings.py`, or the `settings_local.py`
  // suffix spelling) is covered too — `local_settings.py` is specifically
  // the file that holds the values kept out of version control, so it is
  // the higher-value read of the family. The affix list is a closed
  // allowlist, so unrelated basenames (`user_settings.py`) do not match.
  {
    pattern:
      /^\/(?:[^/]+\/)*(?:(?:local|base|common|dev|development|prod|production|staging|test)_)?settings(?:_(?:local|base|common|dev|development|prod|production|staging|test))?\.py$/,
    category: 'config-leak',
    subcategory: 'django-settings',
    template: 'django-settings',
  },
  {
    pattern: /^\/cgi-bin\/.+/,
    category: 'cve-recon',
    subcategory: 'cgi',
    template: 'not-found',
  },
  {
    pattern: /^\/.*(shell|c99|r57|wso)\.[a-z]+$/,
    category: 'webshell',
    subcategory: 'named-shell',
    template: 'not-found',
  },
  // Git repo metadata (distinct from credentials). The bare .git/
  // directory index leads on to the existing fake .git/config &
  // .git/HEAD. These are anchored so they do not shadow the
  // /.git/<file> pattern below (regex-verified).
  {
    pattern: /^\/(?:[^/]+\/)*\.git\/?$/,
    category: 'config-leak',
    subcategory: 'git',
    template: 'fake-git-dir-listing',
  },
  {
    pattern: /^\/(?:[^/]+\/)*\.gitignore$/,
    category: 'config-leak',
    subcategory: 'git',
    template: 'fake-gitignore',
  },
  {
    pattern: /^\/(?:[^/]+\/)*\.gitattributes$/,
    category: 'config-leak',
    subcategory: 'git',
    template: 'fake-gitattributes',
  },
  {
    pattern: /^\/(?:[^/]+\/)*\.gitmodules$/,
    category: 'config-leak',
    subcategory: 'git',
    template: 'fake-gitmodules',
  },
  // `.git/config` and `.git/HEAD` at ANY depth — scanners spray the repo
  // metadata under many dir prefixes (`/app/.git/config`, `/api/.git/config`,
  // `/wp-content/.git/config`, …), not just the web root. The root paths are
  // explicit catalog entries (checked first); these serve the same decoys
  // for the subdirectory forms. Matched ahead of the `.git/<other>` 404
  // catch-all below.
  {
    pattern: /^\/(?:[^/]+\/)*\.git\/config$/,
    category: 'config-leak',
    subcategory: 'git',
    template: 'fake-git-config',
  },
  {
    pattern: /^\/(?:[^/]+\/)*\.git\/HEAD$/,
    category: 'config-leak',
    subcategory: 'git',
    template: 'fake-git-head',
  },
  {
    pattern: /^\/(?:[^/]+\/)*\.git\/.+/,
    category: 'config-leak',
    subcategory: 'git',
    template: 'not-found',
  },
  // Subversion working-copy metadata exposed under the web root — the SVN
  // parallel to the `.git/` family (CWE-538 source disclosure). `.svn/entries`
  // is the file scanners read first to confirm `.svn` and (in the ≤1.6
  // format) harvest the repository URL, so it gets a decoy; everything else
  // under `.svn/` (the 1.7+ `wc.db` SQLite, `pristine/…`) is 404 — coherent
  // with the old-format entries we serve (a 1.6 working copy has no wc.db).
  // entries pattern is matched ahead of the `.svn/*` catch-all below.
  {
    pattern: /^\/(?:[^/]+\/)*\.svn\/entries$/,
    category: 'config-leak',
    subcategory: 'svn',
    template: 'fake-svn-entries',
  },
  {
    pattern: /^\/(?:[^/]+\/)*\.svn(?:\/.*)?$/,
    category: 'config-leak',
    subcategory: 'svn',
    template: 'not-found',
  },
  {
    pattern: /^\/_search.*/,
    category: 'cve-recon',
    subcategory: 'elasticsearch',
    template: 'not-found',
  },
  // WebLogic admin console — `/console/` (with or without anything
  // after the trailing slash) is the canonical base path of the
  // admin webapp, target of the long-running deserialization CVE
  // family (CVE-2017-3506 / -10271 / -3248 / -2628, CVE-2019-2725 /
  // -2729, CVE-2020-2551 / -14882 / -14883, …). The bare-dir variant
  // `/console/` is enumerated by scanners separately from the named
  // child paths, so the pattern needs the `*` quantifier.
  {
    pattern: /^\/console\/.*$/,
    category: 'cve-recon',
    subcategory: 'weblogic',
    template: 'not-found',
  },
  {
    pattern: /^\/actuator\/.+/,
    category: 'cve-recon',
    subcategory: 'spring',
    template: 'spring-actuator-generic',
  },
  // Atlassian Jira static-resource path-traversal version fingerprint:
  //   /s/<token>/_/;/META-INF/maven/com.atlassian.jira/jira-webapp-dist/pom.properties
  // The trailing `;`-segment bypasses the static-resource filter and
  // returns the bundled pom.properties (CVE-2019-8442 — also the
  // ServletPath issue that enabled CVE-2019-8449 / -8451 SSRF recon).
  // <token> is scanner-generated; we accept any non-`/` segment.
  {
    pattern:
      /^\/s\/[^/]+\/_\/;\/META-INF\/maven\/com\.atlassian\.jira\/jira-webapp-dist\/pom\.properties$/,
    category: 'cve-recon',
    subcategory: 'atlassian-jira',
    template: 'jira-pom-properties',
  },
  // Same `/s/<token>/_/;` static-resource filter bypass as the Jira
  // pom.properties fingerprint above, here aimed at the container
  // deployment descriptor instead: /s/<token>/_/;/WEB-INF/web.xml.
  // Must be checked before the bare any-depth WEB-INF/web.xml pattern
  // below, since that broader pattern's `[^/]+` segments also match
  // this wrapper.
  {
    pattern: /^\/s\/[^/]+\/_\/;\/WEB-INF\/web\.xml$/,
    category: 'cve-recon',
    subcategory: 'atlassian-webxml',
    template: 'atlassian-webxml',
  },
  // Bare (or any-depth-prefixed) `WEB-INF/web.xml` with no bypass
  // wrapper. Servlet containers block `/WEB-INF/*` unconditionally at
  // the mapper level — no admin misconfiguration serves this without a
  // bypass technique like the one above — so an unwrapped request
  // realistically 404s regardless of the app behind it. Tier 3
  // (`not-found`); the entry exists to land this in
  // `config-leak/java-webxml` in the rollups instead of `unknown`.
  {
    pattern: /^\/(?:[^/]+\/)*WEB-INF\/web\.xml$/,
    category: 'config-leak',
    subcategory: 'java-webxml',
    template: 'not-found',
  },
  // Django Debug Toolbar endpoints under the `__debug__/` namespace
  // (render_panel, sql_select, sql_explain, template_source,
  // history_sidebar, …). DjDT shipped with DEBUG=True in production
  // leaks SQL / settings / request data, and its sql_select /
  // sql_explain views have historically executed attacker-influenced
  // SQL. CWE-200 + CWE-489; no single product CVE. The `__debug__`
  // namespace is DjDT-specific, so the broad `.+` tail is safe.
  // Same family as the yii2-debug / laravel-telescope decoys.
  {
    pattern: /^\/__debug__\/.+/,
    category: 'cve-recon',
    subcategory: 'django-debug-toolbar',
    template: 'django-debug-toolbar',
  },
  // Docker Registry HTTP API V2 tag-list endpoint
  // (`GET /v2/<name>/tags/list`). Follow-on from the `/v2/_catalog`
  // decoy: scanners read the catalog, then enumerate tags for each
  // repository. The repository name is variable (one or more path
  // segments — `app/api`, `infra/proxy`, …), so this is a pattern
  // rather than per-repo catalog rows; the template returns canned tags
  // for the advertised repositories and a `NAME_UNKNOWN` 404 for
  // anything else. `/v2/` and `/v2/_catalog` are explicit catalog
  // entries (checked first) and do not end in `/tags/list`, so they are
  // unaffected.
  {
    pattern: /^\/v2\/[^/]+(?:\/[^/]+)*\/tags\/list$/,
    category: 'api-recon',
    subcategory: 'docker-registry',
    template: 'docker-registry-tags',
  },
  // Docker Registry HTTP API V2 manifest endpoint
  // (`GET /v2/<name>/manifests/<reference>`). Last hop of the registry
  // probe chain: scanners read `_catalog`, enumerate `tags/list`, then
  // pull each tag's manifest to inventory the image. The repository name
  // is variable (one or more segments) and the reference is a single
  // segment (a tag or a `sha256:…` digest, neither of which contains a
  // slash), so this is a pattern rather than per-repo catalog rows. The
  // template serves a schema-2 manifest for the advertised (repo, tag)
  // pairs and a `MANIFEST_UNKNOWN` 404 otherwise. Distinct `/manifests/`
  // suffix means it never overlaps the `/tags/list` entry above.
  {
    pattern: /^\/v2\/[^/]+(?:\/[^/]+)*\/manifests\/[^/]+$/,
    category: 'api-recon',
    subcategory: 'docker-registry',
    template: 'docker-registry-manifests',
  },
  // Docker Registry HTTP API V2 blob endpoint
  // (`GET /v2/<name>/blobs/<digest>`). Final hop of the registry probe
  // chain: after pulling a manifest, scanners fetch its referenced blobs —
  // above all the config blob, whose `config.Env` leaks the secrets baked
  // into the image (this is the payoff of registry scanning). The repository
  // name is variable (one or more segments) and the digest is a single
  // `sha256:…` segment. The template serves the config JSON / a small gzip
  // for the digests the manifest decoy advertises and a `BLOB_UNKNOWN` 404
  // otherwise. Distinct `/blobs/` suffix means it never overlaps the
  // `/manifests/` or `/tags/list` entries.
  {
    pattern: /^\/v2\/[^/]+(?:\/[^/]+)*\/blobs\/[^/]+$/,
    category: 'api-recon',
    subcategory: 'docker-registry',
    template: 'docker-registry-blobs',
  },
  // Atlassian Confluence AUI Velocity templates (`/template/aui/<name>.vm`)
  // — the unauthenticated OGNL-injection sink of CVE-2021-26084. Scanners
  // POST a crafted `queryString` that a vulnerable server evaluates as
  // OGNL (pre-auth RCE). `text-inline.vm` is the most sprayed; sibling
  // AUI templates share the sink, so match the family. The template
  // renders a plausible AUI fragment and never evaluates/reflects the
  // payload — the probe is captured, not executed.
  {
    pattern: /^\/template\/aui\/[^/]+\.vm$/,
    category: 'cve-recon',
    subcategory: 'confluence',
    template: 'confluence-text-inline',
  },
  // GraphQL endpoints mounted at non-root paths — scanners POST an
  // introspection query to enumerate the schema wherever the API lives
  // (`/api/graphql`, `/wp-json/wp/v2/graphql`, …). Root `/graphql` is the
  // explicit catalog entry (checked first); this covers the rest. Final
  // `graphql` segment only, so it does not collide with the WP REST
  // routes above (none ends in `graphql`). Same introspection decoy.
  {
    pattern: /^\/(?:[^/]+\/+)*graphql$/,
    category: 'api-recon',
    subcategory: 'graphql',
    template: 'graphql-introspection',
  },
  // WordPress XML-RPC at any depth / with doubled slashes
  // (`/blog//xmlrpc.php`, `/sub/xmlrpc.php`). Root `/xmlrpc.php` is the
  // explicit catalog entry (checked first); the `[^/]+\/+` prefix mirrors
  // the wp-json patterns' tolerance for scanner-emitted `//`. Same
  // pingback / system.multicall amplification + brute-force surface.
  {
    pattern: /^\/(?:[^/]+\/+)*xmlrpc\.php$/,
    category: 'cms-auth',
    subcategory: 'wordpress',
    template: 'wordpress-xmlrpc',
  },
];

export function findPatternBait(path: string): PatternEntry | undefined {
  return patternBait.find((entry) => entry.pattern.test(path));
}
