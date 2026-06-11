import type { PatternEntry } from '../types.js';

export const patternBait: PatternEntry[] = [
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
    pattern:
      /^\/(?:[^/]+\/)*(?:phpinfo|_phpinfo|old_phpinfo|phpversion|php-info|php_info|php|pinfo|pi|p|i|info|test|debug|server-status|server_status|server-info|server_info)\.php$/,
    category: 'config-leak',
    subcategory: 'phpinfo',
    template: 'phpinfo',
  },
  {
    pattern: /^\/(?:[^/]+\/)*(?:phpinfo|php-info|info)$/,
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
  // GCP service-account JSON key files. Operators routinely commit
  // these under varied basenames (keyfile.json, service-account.json,
  // firebase-adminsdk.json, application_default_credentials.json, …).
  // Final segment must match a known basename + `.json`; any depth.
  // Same credential-theft class as the .aws/* and .git-credentials
  // family, so this is `cloud-credentials` subcategory.
  {
    pattern:
      /^\/(?:[^/]+\/)*(?:keyfile|key|google-key|firebase-key|firebase-adminsdk|service-account|sa|google-credentials|gcp-sa|gcp-key|gcp-credentials|credentials|application_default_credentials)\.json$/,
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
  // Django `settings.py` at any depth (e.g. `/settings.py`,
  // `/<project>/settings.py`, `/config/settings.py`). Exposes
  // `SECRET_KEY`, `DATABASES['default']`, and `EMAIL_HOST_PASSWORD`
  // when served as source. CWE-200 / CWE-538 disclosure class.
  {
    pattern: /^\/(?:[^/]+\/)*settings\.py$/,
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
  {
    pattern: /^\/\.git\/.+/,
    category: 'config-leak',
    subcategory: 'git',
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
