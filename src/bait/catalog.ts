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
  {
    path: '/___proxy_subdomain_whm/login',
    category: 'cms-auth',
    subcategory: 'whm',
    template: 'whm-login',
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
  // VS Code SFTP extension (liximomo / Natizyskunk fork) deploy config:
  // host / username / password / privateKeyPath / passphrase in cleartext.
  // Same credential-theft class as .aws/credentials & .git-credentials.
  {
    path: '/.vscode/sftp.json',
    category: 'config-leak',
    subcategory: 'editor-credentials',
    template: 'fake-vscode-sftp',
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
