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

  // config-leak
  { path: '/.env', category: 'config-leak', subcategory: 'dotenv', template: 'fake-env' },
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
    path: '/.aws/credentials',
    category: 'config-leak',
    subcategory: 'aws',
    template: 'fake-aws-credentials',
  },
  {
    path: '/server-status',
    category: 'config-leak',
    subcategory: 'apache',
    template: 'fake-server-status',
  },
  { path: '/.DS_Store', category: 'config-leak', subcategory: 'macos', template: 'not-found' },

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
  {
    path: '/graphql',
    category: 'api-recon',
    subcategory: 'graphql',
    template: 'graphql-introspection',
  },
  { path: '/api/v1/health', category: 'api-recon', subcategory: 'generic', template: 'api-health' },

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
