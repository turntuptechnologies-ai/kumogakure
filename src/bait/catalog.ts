import type { BaitEntry } from '../types.js';

export const explicitBait: BaitEntry[] = [
  // cms-auth
  {
    path: '/wp-login.php',
    category: 'cms-auth',
    subcategory: 'wordpress',
    template: 'wordpress-login',
  },
  {
    path: '/xmlrpc.php',
    category: 'cms-auth',
    subcategory: 'wordpress',
    template: 'wordpress-xmlrpc',
  },
  // Yoast SEO / Rank Math author sitemap — lists one `/author/<slug>/`
  // URL per account, leaking the username-slug set (credential-stuffing
  // input), same threat as the core `wp-sitemap-users-<n>.xml` pattern.
  {
    path: '/author-sitemap.xml',
    category: 'cms-auth',
    subcategory: 'wordpress-user-sitemap',
    template: 'wordpress-user-sitemap',
  },
  // WordPress core sitemap index (WP 5.5+) — the discovery entry point a
  // scanner reads first; it lists `wp-sitemap-users-1.xml`, which the
  // wordpress-user-sitemap decoy serves. Serving the index keeps that
  // enumeration chain coherent (index -> user sitemap -> slugs).
  {
    path: '/wp-sitemap.xml',
    category: 'cms-auth',
    subcategory: 'wordpress-fingerprint',
    template: 'wordpress-sitemap-index',
  },
  {
    path: '/administrator/index.php',
    category: 'cms-auth',
    subcategory: 'joomla',
    template: 'joomla-login',
  },
  {
    path: '/phpmyadmin/',
    category: 'cms-auth',
    subcategory: 'phpmyadmin',
    template: 'phpmyadmin-login',
  },
  { path: '/user/login', category: 'cms-auth', subcategory: 'drupal', template: 'drupal-login' },
  // cPanel / WHM service-subdomain proxy fingerprint endpoints — the
  // `/___proxy_subdomain_<service>` convention is cPanel's own URL
  // shape for routing the panel/admin UI on shared infra. Both have
  // an active CVE history (XSS / auth-bypass families) and are stuffed
  // by credential-rotation bots constantly.
  {
    path: '/___proxy_subdomain_cpanel',
    category: 'cms-auth',
    subcategory: 'cpanel',
    template: 'cpanel-login',
  },
  // cPanel redirects the bare proxy path to `…/login`; scanners hit the
  // `/login` form directly, so cover it too (the WHM entry below already
  // does — this closes the asymmetry where cPanel had only the bare path).
  {
    path: '/___proxy_subdomain_cpanel/login',
    category: 'cms-auth',
    subcategory: 'cpanel',
    template: 'cpanel-login',
  },
  {
    path: '/___proxy_subdomain_whm/login',
    category: 'cms-auth',
    subcategory: 'whm',
    template: 'whm-login',
  },
  // Bare `/whm` (and trailing-slash variant) — the canonical WHM entry
  // path scanners probe directly; real WHM bounces it to the login UI, so
  // serve the same decoy as the proxy-subdomain form above.
  {
    path: '/whm',
    category: 'cms-auth',
    subcategory: 'whm',
    template: 'whm-login',
  },
  {
    path: '/whm/',
    category: 'cms-auth',
    subcategory: 'whm',
    template: 'whm-login',
  },
  // cPanel's OpenID Connect provider initiation endpoint. The built-in
  // "cpanelid" provider lives at `/openid_connect/<provider>`; hit
  // without a valid flow it bounces to the cPanel login UI, so serve the
  // same login decoy. Probed by cPanel-aware credential bots alongside
  // the proxy-subdomain paths.
  {
    path: '/openid_connect/cpanelid',
    category: 'cms-auth',
    subcategory: 'cpanel',
    template: 'cpanel-login',
  },
  // Bare `/login` — this is exactly where the cPanel login form posts
  // (`<form action="/login" method="post">`), so a credential-stuffer
  // that loads the decoy and submits lands here; without this entry our
  // own decoy chain would dead-end at category=unknown on the POST.
  // Doubles as the catch for scanners spraying the generic `/login`
  // path. POST renders the cPanel "The login is invalid." state.
  {
    path: '/login',
    category: 'cms-auth',
    subcategory: 'cpanel',
    template: 'cpanel-login',
  },
  {
    path: '/login/',
    category: 'cms-auth',
    subcategory: 'cpanel',
    template: 'cpanel-login',
  },
  // Atlassian Jira authenticated dashboard entry point. Anonymous access
  // bounces to the Jira login gadget, so this is a high-signal Jira
  // product/version fingerprint — scanners confirm Jira, then target its
  // CVE surface (CVE-2019-11581 SSTI, CVE-2020-14179 Dashboard info
  // disclosure, CVE-2022-0540 auth bypass). `/login.jsp` is where the
  // served form posts, so it shares the decoy (otherwise a submit would
  // dead-end at unknown). Same `atlassian-jira` subcategory as the
  // jira-pom-properties version decoy.
  {
    path: '/secure/Dashboard.jspa',
    category: 'cms-auth',
    subcategory: 'atlassian-jira',
    template: 'jira-login',
  },
  {
    path: '/login.jsp',
    category: 'cms-auth',
    subcategory: 'atlassian-jira',
    template: 'jira-login',
  },

  // config-leak
  { path: '/.env', category: 'config-leak', subcategory: 'dotenv', template: 'fake-env' },
  { path: '/env', category: 'config-leak', subcategory: 'dotenv', template: 'fake-env' },
  {
    path: '/.git/config',
    category: 'config-leak',
    subcategory: 'git',
    template: 'fake-git-config',
  },
  { path: '/.git/HEAD', category: 'config-leak', subcategory: 'git', template: 'fake-git-head' },
  {
    path: '/wp-config.php.bak',
    category: 'config-leak',
    subcategory: 'wordpress',
    template: 'fake-wp-config',
  },
  {
    path: '/server-status',
    category: 'config-leak',
    subcategory: 'apache',
    template: 'fake-server-status',
  },
  { path: '/.DS_Store', category: 'config-leak', subcategory: 'macos', template: 'not-found' },
  // ASP.NET (Framework) web.config XML — leaks <connectionStrings>
  // and <appSettings> in cleartext when served as source. ASP.NET
  // Core's appsettings.json is the JSON-era equivalent; both share
  // the `aspnet-config` subcategory since they're the same disclosure
  // class.
  {
    path: '/web.config',
    category: 'config-leak',
    subcategory: 'aspnet-config',
    template: 'aspnet-web-config',
  },
  {
    path: '/appsettings.json',
    category: 'config-leak',
    subcategory: 'aspnet-config',
    template: 'dotnet-appsettings',
  },
  // VS Code SFTP extension (liximomo / Natizyskunk fork) deploy config:
  // host / username / password / privateKeyPath / passphrase in cleartext.
  // Same credential-theft class as .aws/credentials & .git-credentials.
  {
    path: '/.vscode/sftp.json',
    category: 'config-leak',
    subcategory: 'editor-credentials',
    template: 'fake-vscode-sftp',
  },
  // Joomla `configuration.php` — `class JConfig` holding DB
  // credentials, mailer SMTP credentials, the app `$secret`, and
  // FTP credentials. CWE-200 / CWE-538 source-disclosure class
  // (PHP misconfigured to serve .php as text).
  {
    path: '/configuration.php',
    category: 'config-leak',
    subcategory: 'joomla-config',
    template: 'joomla-configuration-php',
  },
  // Drupal `settings.php` — `$databases['default']['default']`
  // + `$settings['hash_salt']` + Redis credentials.
  {
    path: '/settings.php',
    category: 'config-leak',
    subcategory: 'drupal-config',
    template: 'drupal-settings-php',
  },
  // Generic PHP DB-config filenames. `/database.php` is Laravel's
  // canonical `config/database.php` convention (Tier 1 `return [...]`
  // shape); `/db.php` is the procedural custom-PHP naming. Both leak
  // DB credentials in cleartext when served as source — same template
  // (the array form satisfies both scanner expectations).
  {
    path: '/database.php',
    category: 'config-leak',
    subcategory: 'php-db-config',
    template: 'php-database-config',
  },
  {
    path: '/db.php',
    category: 'config-leak',
    subcategory: 'php-db-config',
    template: 'php-database-config',
  },
  // PHP `composer.json` — package manifest, no secrets but discloses
  // pinned dependency versions for downstream CVE matching. Same
  // class as `package.json` / `pom.properties` version-disclosure
  // paths (Tier 2).
  {
    path: '/composer.json',
    category: 'config-leak',
    subcategory: 'php-package-manifest',
    template: 'composer-json',
  },

  // cve-recon
  {
    path: '/actuator/health',
    category: 'cve-recon',
    subcategory: 'spring',
    template: 'spring-actuator-health',
  },
  {
    path: '/actuator/env',
    category: 'cve-recon',
    subcategory: 'spring',
    template: 'spring-actuator-env',
  },
  {
    path: '/solr/admin/cores',
    category: 'cve-recon',
    subcategory: 'solr',
    template: 'solr-admin-cores',
  },
  { path: '/vpn/index.html', category: 'cve-recon', subcategory: 'citrix', template: 'citrix-vpn' },
  {
    path: '/owa/auth/logon.aspx',
    category: 'cve-recon',
    subcategory: 'exchange',
    template: 'exchange-owa-login',
  },
  {
    path: '/-/users/sign_in',
    category: 'cve-recon',
    subcategory: 'gitlab',
    template: 'gitlab-sign-in',
  },
  {
    // CVE-2026-4020: unauthenticated System Report disclosure.
    path: '/wp-json/gravitysmtp/v1/tests/mock-data',
    category: 'cve-recon',
    subcategory: 'gravity-smtp',
    template: 'gravity-smtp-system-report',
  },
  // ASP.NET <trace enabled localOnly="false"> info disclosure
  // (CWE-200 misconfig — no single CVE; classic enumeration target).
  {
    path: '/trace.axd',
    category: 'cve-recon',
    subcategory: 'aspnet-trace',
    template: 'aspnet-trace',
  },
  // Apache Struts /login.action — OGNL CVE family target:
  //   CVE-2017-5638  (S2-045, multipart Content-Type — Equifax)
  //   CVE-2017-9805  (S2-052, REST plugin XStream deserialization)
  //   CVE-2018-11776 (S2-057, namespace/action URL OGNL)
  //   CVE-2023-50164 (file-upload path traversal).
  {
    path: '/login.action',
    category: 'cve-recon',
    subcategory: 'struts',
    template: 'struts-login-action',
  },
  // Laravel Telescope debug dashboard exposed without auth gate
  // (CWE-285 + CWE-200 — misconfigured TelescopeServiceProvider::gate).
  // No single product CVE; Laravel's own docs warn against this.
  {
    path: '/telescope/requests',
    category: 'cve-recon',
    subcategory: 'laravel-telescope',
    template: 'laravel-telescope',
  },
  // Yii2 Debug Toolbar request-log viewer (`yii\debug\Module`) exposed
  // to non-allowed IPs in production — CWE-200 + CWE-285, documented
  // misconfiguration of the module's `allowedIPs`. No single product
  // CVE.
  {
    path: '/debug/default/view',
    category: 'cve-recon',
    subcategory: 'yii2-debug',
    template: 'yii2-debug',
  },
  // Exchange /ecp/ ClickOnce eDiscovery Export Tool manifest. Used as
  // a fingerprint that the /ecp/ surface is reachable, then exploited
  // via the SSRF + post-auth RCE chains that share that surface:
  //   CVE-2021-26855 / -26857 / -26858 / -27065 (ProxyLogon)
  //   CVE-2021-34473 / -34523 / -31207         (ProxyShell)
  //   CVE-2022-41040 / -41082                  (ProxyNotShell).
  {
    path: '/ecp/Current/exporttool/microsoft.exchange.ediscovery.exporttool.application',
    category: 'cve-recon',
    subcategory: 'exchange',
    template: 'exchange-exporttool',
  },

  // ssrf-bait
  {
    path: '/latest/meta-data/iam/security-credentials/',
    category: 'ssrf-bait',
    subcategory: 'aws',
    template: 'aws-metadata-role',
  },
  {
    path: '/computeMetadata/v1/instance/service-accounts/',
    category: 'ssrf-bait',
    subcategory: 'gcp',
    template: 'gcp-metadata-sa',
  },

  // webshell
  { path: '/shell.php', category: 'webshell', subcategory: 'generic', template: 'not-found' },
  { path: '/upload.php', category: 'webshell', subcategory: 'generic', template: 'upload-success' },

  // api-recon
  {
    path: '/swagger.json',
    category: 'api-recon',
    subcategory: 'openapi',
    template: 'swagger-fake',
  },
  // Swagger UI HTML entrypoints — the SpringFox / springdoc-openapi /
  // webjars conventions all settle on small variants of the same page.
  {
    path: '/swagger-ui.html',
    category: 'api-recon',
    subcategory: 'openapi',
    template: 'swagger-ui-html',
  },
  {
    path: '/swagger/index.html',
    category: 'api-recon',
    subcategory: 'openapi',
    template: 'swagger-ui-html',
  },
  {
    path: '/swagger/swagger-ui.html',
    category: 'api-recon',
    subcategory: 'openapi',
    template: 'swagger-ui-html',
  },
  {
    path: '/webjars/swagger-ui/index.html',
    category: 'api-recon',
    subcategory: 'openapi',
    template: 'swagger-ui-html',
  },
  {
    path: '/graphql',
    category: 'api-recon',
    subcategory: 'graphql',
    template: 'graphql-introspection',
  },
  { path: '/api/v1/health', category: 'api-recon', subcategory: 'generic', template: 'api-health' },
  // Docker Registry HTTP API V2 base / version-check endpoint. Open
  // (no-auth) registries answer `GET /v2/` with `200 {}` and the
  // `Docker-Distribution-Api-Version` header; scanners hit it first to
  // confirm a registry is present before walking `_catalog`. Both the
  // canonical `/v2/` and the bare `/v2` (which real registries redirect
  // to `/v2/`) are covered so neither 404s and tips off the decoy.
  {
    path: '/v2/',
    category: 'api-recon',
    subcategory: 'docker-registry',
    template: 'docker-registry-base',
  },
  {
    path: '/v2',
    category: 'api-recon',
    subcategory: 'docker-registry',
    template: 'docker-registry-base',
  },
  // Docker Registry HTTP API V2 catalog (CWE-306 default-no-auth
  // exposure of a `registry:2` container).
  {
    path: '/v2/_catalog',
    category: 'api-recon',
    subcategory: 'docker-registry',
    template: 'docker-registry-catalog',
  },

  // iot-recon
  { path: '/HNAP1/', category: 'iot-recon', subcategory: 'dlink', template: 'hnap1' },
  {
    path: '/boaform/admin/formLogin',
    category: 'iot-recon',
    subcategory: 'generic-router',
    template: 'boa-form-login',
  },

  // mcp-recon
  { path: '/mcp', category: 'mcp-recon', subcategory: 'mcp', template: 'mcp' },
];

const explicitByPath = new Map(explicitBait.map((entry) => [entry.path, entry]));

export function findExplicitBait(path: string): BaitEntry | undefined {
  return explicitByPath.get(path);
}
