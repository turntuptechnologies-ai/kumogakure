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
];

export function findPatternBait(path: string): PatternEntry | undefined {
  return patternBait.find((entry) => entry.pattern.test(path));
}
