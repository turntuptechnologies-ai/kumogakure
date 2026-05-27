import { describe, expect, it } from 'vitest';
import { findPatternBait, patternBait } from '../../../src/bait/patterns.js';

describe('bait patterns', () => {
  it('matches wp-content PHP uploads', () => {
    expect(findPatternBait('/wp-content/uploads/shell.php')?.category).toBe('webshell');
  });

  it('matches backup file extensions', () => {
    expect(findPatternBait('/database.sql.bak')?.category).toBe('config-leak');
    expect(findPatternBait('/config.old')?.category).toBe('config-leak');
  });

  it('matches tilde-suffixed editor-backup files at any depth', () => {
    for (const p of ['/phpinfo.php~', '/sub/wp-config.php~', '/.env~', '/app/index.php~']) {
      const m = findPatternBait(p);
      expect(m?.category).toBe('config-leak');
      expect(m?.subcategory).toBe('backup');
      expect(m?.template).toBe('not-found');
    }
  });

  it('does not over-match tilde-backup lookalikes', () => {
    for (const p of ['/~user', '/~', '/foo~bar']) {
      expect(findPatternBait(p)).toBeUndefined();
    }
  });

  it('matches .env variants such as .env.production', () => {
    expect(findPatternBait('/.env.production')?.template).toBe('fake-env');
  });

  it('routes Vite dev-server internal routes to cve-recon/vite-fs-traversal', () => {
    // /@fs/, /@id/, /@vite/ exposed in production are the attack surface
    // of the Vite path-traversal CVE family (CVE-2025-30208 / -31125).
    for (const p of [
      '/@fs',
      '/@fs/',
      '/@fs/.env.test',
      '/@fs/etc/passwd',
      '/@id/main.ts',
      '/@vite/client',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category).toBe('cve-recon');
      expect(m?.subcategory).toBe('vite-fs-traversal');
      expect(m?.template).toBe('fake-env');
    }
  });

  it('does not over-match Vite-lookalike paths', () => {
    for (const p of ['/@unknown/x', '/@fsfoo/x', '/foo@fs/x', '/@', '/@foo']) {
      expect(findPatternBait(p)).toBeUndefined();
    }
  });

  it('keeps the existing dotenv routings unaffected by the Vite pattern', () => {
    expect(findPatternBait('/.env.production')?.subcategory).toBe('dotenv-variant');
    expect(findPatternBait('/sub/.env.test')?.subcategory).toBe('dotenv-variant');
    expect(findPatternBait('/sub/.env')?.subcategory).toBe('dotenv');
  });

  it('matches .env in any subdirectory as dotenv', () => {
    for (const p of ['/api/.env', '/backend/.env', '/a/b/c/.env']) {
      const m = findPatternBait(p);
      expect(m?.category).toBe('config-leak');
      expect(m?.subcategory).toBe('dotenv');
      expect(m?.template).toBe('fake-env');
    }
  });

  it('matches subdirectory .env.<suffix> as dotenv-variant', () => {
    const m = findPatternBait('/api/.env.production');
    expect(m?.subcategory).toBe('dotenv-variant');
    expect(m?.template).toBe('fake-env');
  });

  it('matches named env files (<name>.env) as dotenv-variant', () => {
    for (const p of ['/aws.env', '/prod.env', '/sub/staging.env']) {
      const m = findPatternBait(p);
      expect(m?.category).toBe('config-leak');
      expect(m?.subcategory).toBe('dotenv-variant');
      expect(m?.template).toBe('fake-env');
    }
  });

  it('matches numbered / suffixed .env variants (.env1, .env_copy) as dotenv-variant', () => {
    for (const p of ['/.env1', '/.env2', '/.env_copy', '/.env_backup', '/sub/.env1']) {
      const m = findPatternBait(p);
      expect(m?.category).toBe('config-leak');
      expect(m?.subcategory).toBe('dotenv-variant');
      expect(m?.template).toBe('fake-env');
    }
  });

  it('does not over-match suffixed .env variants', () => {
    // The literal `.env` must be followed by a digit or underscore;
    // `.env.production` / `.env-config.js` / `.env~` go elsewhere.
    expect(findPatternBait('/.env.production')?.subcategory).toBe('dotenv-variant');
    expect(findPatternBait('/.env~')?.subcategory).toBe('backup');
    expect(findPatternBait('/.env-config.js')).toBeUndefined();
    expect(findPatternBait('/.environment')).toBeUndefined();
  });

  it('routes CakePHP DebugKit /_environment probes to the env decoy', () => {
    for (const p of ['/_environment', '/webroot/index.php/_environment']) {
      const m = findPatternBait(p);
      expect(m?.category).toBe('config-leak');
      expect(m?.subcategory).toBe('cakephp-debugkit');
      expect(m?.template).toBe('fake-env');
    }
  });

  it('does not over-match the CakePHP _environment endpoint', () => {
    for (const p of [
      '/_environments',
      '/_environment/',
      '/_environment.json',
      '/foo/_environment',
      '/webroot/_environment',
    ]) {
      expect(findPatternBait(p)?.subcategory).not.toBe('cakephp-debugkit');
    }
  });

  it('does not misclassify lookalikes as dotenv', () => {
    for (const p of ['/environment', '/.environment', '/api/env']) {
      expect(findPatternBait(p)).toBeUndefined();
    }
  });

  it('routes common MCP mount paths to the mcp template', () => {
    for (const p of ['/jsonrpc', '/sse', '/messages', '/api/mcp', '/mcp/v1', '/mcp/']) {
      const m = findPatternBait(p);
      expect(m?.category).toBe('mcp-recon');
      expect(m?.subcategory).toBe('mcp');
      expect(m?.template).toBe('mcp');
    }
  });

  it('does not treat MCP lookalikes as mcp-recon', () => {
    expect(findPatternBait('/mcpfoo')).toBeUndefined();
    expect(findPatternBait('/jsonrpcx')).toBeUndefined();
  });

  it('routes the phpinfo-probe family to the phpinfo decoy', () => {
    for (const p of [
      '/phpinfo.php',
      '/info.php',
      '/p.php',
      '/i.php',
      '/_phpinfo.php',
      '/server-status.php',
      '/admin/phpinfo.php',
      '/test/phpinfo.php',
      '/phpinfo',
      '/info',
      '/_profiler/phpinfo',
      // underscore spellings of the hyphenated allowlist entries
      '/php_info.php',
      '/server_info.php',
      '/server_status.php',
      '/sub/php_info.php',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category).toBe('config-leak');
      expect(m?.subcategory).toBe('phpinfo');
      expect(m?.template).toBe('phpinfo');
    }
  });

  it('routes git home-dotfiles at any depth, splitting credentials', () => {
    for (const p of ['/root/.gitconfig', '/.gitconfig', '/home/u/.gitconfig']) {
      const m = findPatternBait(p);
      expect(m?.category).toBe('config-leak');
      expect(m?.subcategory).toBe('git');
      expect(m?.template).toBe('fake-gitconfig');
    }
    for (const p of ['/root/.git-credentials', '/.git-credentials', '/var/www/.git-credentials']) {
      const m = findPatternBait(p);
      expect(m?.category).toBe('config-leak');
      expect(m?.subcategory).toBe('git-credentials');
      expect(m?.template).toBe('fake-git-credentials');
    }
  });

  it('routes cloud credential dotfiles at any depth, config split out', () => {
    const credCases: Array<[string, string]> = [
      ['/root/.aws/credentials', 'fake-aws-credentials'],
      ['/.aws/credentials', 'fake-aws-credentials'],
      ['/root/.s3cfg', 'fake-s3cfg'],
      ['/.s3cfg', 'fake-s3cfg'],
      ['/root/.boto', 'fake-boto'],
      ['/.boto', 'fake-boto'],
    ];
    for (const [p, tpl] of credCases) {
      const m = findPatternBait(p);
      expect(m?.category).toBe('config-leak');
      expect(m?.subcategory).toBe('cloud-credentials');
      expect(m?.template).toBe(tpl);
    }
    for (const p of ['/root/.aws/config', '/.aws/config', '/home/u/.aws/config']) {
      const m = findPatternBait(p);
      expect(m?.category).toBe('config-leak');
      expect(m?.subcategory).toBe('aws');
      expect(m?.template).toBe('fake-aws-config');
    }
  });

  it('does not over-match cloud credential lookalikes', () => {
    for (const p of ['/foo.boto', '/.s3cfgx', '/.aws/credentialsx', '/.aws', '/aws/config']) {
      expect(findPatternBait(p)).toBeUndefined();
    }
  });

  it('routes GCP service-account JSON key probes at any depth to cloud-credentials', () => {
    for (const p of [
      '/keyfile.json',
      '/key.json',
      '/service-account.json',
      '/sa.json',
      '/firebase-adminsdk.json',
      '/firebase-key.json',
      '/google-key.json',
      '/google-credentials.json',
      '/gcp-sa.json',
      '/gcp-key.json',
      '/gcp-credentials.json',
      '/credentials.json',
      '/application_default_credentials.json',
      '/config/credentials.json',
      '/secrets/service-account.json',
      '/a/b/c/keyfile.json',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category).toBe('config-leak');
      expect(m?.subcategory).toBe('cloud-credentials');
      expect(m?.template).toBe('fake-gcp-service-account-key');
    }
  });

  it('does not over-match GCP service-account JSON lookalikes', () => {
    for (const p of [
      '/keyfile.txt',
      '/foo-key.json',
      '/notkey.json',
      '/keyfile.json.bak',
      '/keyfile.jsonx',
      '/key.json/extra',
      '/manifest.json',
      '/package.json',
    ]) {
      const m = findPatternBait(p);
      // Either undefined, or routed via a different rule — must not be
      // the GCP SA decoy.
      expect(m?.template).not.toBe('fake-gcp-service-account-key');
    }
  });

  it('routes .netrc / _netrc at any depth to the netrc decoy', () => {
    for (const p of ['/.netrc', '/root/.netrc', '/home/u/_netrc', '/var/www/.netrc']) {
      const m = findPatternBait(p);
      expect(m?.category).toBe('config-leak');
      expect(m?.subcategory).toBe('netrc');
      expect(m?.template).toBe('fake-netrc');
    }
  });

  it('does not over-match netrc lookalikes', () => {
    for (const p of ['/foo.netrc', '/.netrcx', '/netrc', '/.netr']) {
      expect(findPatternBait(p)).toBeUndefined();
    }
  });

  it('routes package-registry credential files at any depth', () => {
    const cases: Array<[string, string]> = [
      ['/.npmrc', 'fake-npmrc'],
      ['/root/.npmrc', 'fake-npmrc'],
      ['/.pypirc', 'fake-pypirc'],
      ['/home/u/.pypirc', 'fake-pypirc'],
    ];
    for (const [p, tpl] of cases) {
      const m = findPatternBait(p);
      expect(m?.category).toBe('config-leak');
      expect(m?.subcategory).toBe('package-registry-credentials');
      expect(m?.template).toBe(tpl);
    }
  });

  it('does not over-match registry credential lookalikes', () => {
    for (const p of ['/foo.npmrc', '/.npmrcx', '/npmrc', '/.pypircx']) {
      expect(findPatternBait(p)).toBeUndefined();
    }
  });

  it('routes git repo-metadata to config-leak/git decoys', () => {
    const cases: Array<[string, string]> = [
      ['/.git/', 'fake-git-dir-listing'],
      ['/.git', 'fake-git-dir-listing'],
      ['/sub/.git/', 'fake-git-dir-listing'],
      ['/.gitignore', 'fake-gitignore'],
      ['/app/.gitignore', 'fake-gitignore'],
      ['/.gitattributes', 'fake-gitattributes'],
      ['/.gitmodules', 'fake-gitmodules'],
    ];
    for (const [p, tpl] of cases) {
      const m = findPatternBait(p);
      expect(m?.category).toBe('config-leak');
      expect(m?.subcategory).toBe('git');
      expect(m?.template).toBe(tpl);
    }
  });

  it('routes wp-includes/ID3/license.txt at any depth (including double-slash prefixes)', () => {
    for (const p of [
      '/wp-includes/ID3/license.txt',
      '/blog/wp-includes/ID3/license.txt',
      '/blog//wp-includes/ID3/license.txt', // scanner double-slash artifact
      '/2024/wp-includes/ID3/license.txt',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category).toBe('cms-auth');
      expect(m?.subcategory).toBe('wordpress-fingerprint');
      expect(m?.template).toBe('wordpress-id3-license');
    }
  });

  it('does not over-match ID3/license.txt lookalikes', () => {
    for (const p of [
      '/wp-includes/ID3/license.txt.bak',
      '/wp-includes/license.txt',
      '/ID3/license.txt',
      '/wp-includes/ID3/changelog.txt',
    ]) {
      expect(findPatternBait(p)?.template).not.toBe('wordpress-id3-license');
    }
  });

  it('routes wp-json/wp/v2/users/ at any depth (including double-slash prefixes)', () => {
    for (const p of [
      '/wp-json/wp/v2/users/',
      '/wp-json/wp/v2/users',
      '/blog/wp-json/wp/v2/users/',
      '/blog//wp-json/wp/v2/users/', // scanner double-slash artifact
    ]) {
      const m = findPatternBait(p);
      expect(m?.category).toBe('cms-auth');
      expect(m?.subcategory).toBe('wordpress-rest-users');
      expect(m?.template).toBe('wordpress-users-api');
    }
  });

  it('does not over-match wp-json/wp/v2/users lookalikes', () => {
    for (const p of [
      '/wp-json/wp/v2/users/1', // user-by-id is a different endpoint
      '/wp-json/wp/v2/usersx',
      '/wp-json/wp/v2/posts',
    ]) {
      expect(findPatternBait(p)?.template).not.toBe('wordpress-users-api');
    }
  });

  it('routes wp-json/oembed/1.0/embed at any depth (including double-slash prefixes)', () => {
    for (const p of [
      '/wp-json/oembed/1.0/embed',
      '/blog/wp-json/oembed/1.0/embed',
      '/blog//wp-json/oembed/1.0/embed',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category).toBe('cms-auth');
      expect(m?.subcategory).toBe('wordpress-fingerprint');
      expect(m?.template).toBe('wordpress-oembed');
    }
  });

  it('does not over-match wp-json/oembed lookalikes', () => {
    for (const p of [
      '/wp-json/oembed/1.0/embedx',
      '/wp-json/oembed/1.0/proxy',
      '/wp-json/oembed/2.0/embed',
    ]) {
      expect(findPatternBait(p)?.template).not.toBe('wordpress-oembed');
    }
  });

  it('routes wp-includes/wlwmanifest.xml at any depth to the WordPress fingerprint decoy', () => {
    for (const p of [
      '/wp-includes/wlwmanifest.xml',
      '/blog/wp-includes/wlwmanifest.xml',
      '/wp/wp-includes/wlwmanifest.xml',
      '/2018/wp-includes/wlwmanifest.xml',
      '/sito/wp-includes/wlwmanifest.xml',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category).toBe('cms-auth');
      expect(m?.subcategory).toBe('wordpress-fingerprint');
      expect(m?.template).toBe('fake-wlwmanifest');
    }
  });

  it('does not over-match wlwmanifest lookalikes; existing wp patterns intact', () => {
    expect(findPatternBait('/wlwmanifest.xml')).toBeUndefined();
    expect(findPatternBait('/wp-includes/foo.xml')).toBeUndefined();
    expect(findPatternBait('/wp-includes/wlwmanifest.xml.bak')?.subcategory).toBe('backup');
    expect(findPatternBait('/wp-includes/foo.php')?.subcategory).toBe('wp-includes');
  });

  it('keeps the existing /.git/<file> behaviour and rejects lookalikes', () => {
    // Anchored dir pattern must NOT swallow repo-content paths.
    const cfg = findPatternBait('/.git/config');
    expect(cfg?.subcategory).toBe('git');
    expect(cfg?.template).toBe('not-found');
    expect(findPatternBait('/.git/refs/heads/main')?.template).toBe('not-found');
    for (const p of ['/.gitignorex', '/foo.gitmodules', '/gitignore', '/.gitfoo']) {
      expect(findPatternBait(p)).toBeUndefined();
    }
  });

  it('does not over-match git dotfile lookalikes and leaves .git/ intact', () => {
    expect(findPatternBait('/foo.gitconfig')).toBeUndefined();
    expect(findPatternBait('/gitconfig')).toBeUndefined();
    expect(findPatternBait('/.gitconfigx')).toBeUndefined();
    // The existing .git/ repo family is unchanged (different filename).
    expect(findPatternBait('/.git/config')?.subcategory).toBe('git');
    expect(findPatternBait('/.git/config')?.template).toBe('not-found');
  });

  it('does not over-match generic .php names as phpinfo', () => {
    for (const p of ['/index.php', '/contact.php', '/information.php', '/login.php']) {
      expect(findPatternBait(p)).toBeUndefined();
    }
  });

  it('matches /actuator/* for the generic Spring fallback', () => {
    expect(findPatternBait('/actuator/beans')?.template).toBe('spring-actuator-generic');
  });

  it('routes Spring Boot application.yml at any classpath depth', () => {
    for (const p of [
      '/application.yml',
      '/application.yaml',
      '/config/application.yml',
      '/src/main/resources/application.yml',
      '/BOOT-INF/classes/application.yml',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category).toBe('config-leak');
      expect(m?.subcategory).toBe('spring-config');
      expect(m?.template).toBe('spring-application-yml');
    }
  });

  it('does not over-match Spring application.yml lookalikes', () => {
    for (const p of ['/application.yml.bak', '/notapplication.yml', '/application.yml/']) {
      expect(findPatternBait(p)?.subcategory).not.toBe('spring-config');
    }
  });

  it('routes Symfony parameters.yml at any depth', () => {
    for (const p of [
      '/parameters.yml',
      '/parameters.yaml',
      '/app/config/parameters.yml',
      '/config/parameters.yml',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category).toBe('config-leak');
      expect(m?.subcategory).toBe('symfony-config');
      expect(m?.template).toBe('symfony-parameters-yml');
    }
  });

  it('routes docker-compose.yml and per-environment overrides', () => {
    for (const p of [
      '/docker-compose.yml',
      '/docker-compose.yaml',
      '/docker-compose.override.yml',
      '/docker-compose.prod.yml',
      '/docker-compose.staging.yml',
      '/docker-compose.dev.yml',
      '/deploy/docker-compose.yml',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category).toBe('config-leak');
      expect(m?.subcategory).toBe('docker-compose');
      expect(m?.template).toBe('docker-compose-yml');
    }
  });

  it('does not over-match docker-compose lookalikes', () => {
    for (const p of [
      '/docker-compose.yml.bak',
      '/docker-composex.yml',
      '/docker-compose.unknown-env.yml',
    ]) {
      expect(findPatternBait(p)?.subcategory).not.toBe('docker-compose');
    }
  });

  it('routes Django settings.py at any depth', () => {
    for (const p of ['/settings.py', '/config/settings.py', '/myapp/settings.py']) {
      const m = findPatternBait(p);
      expect(m?.category).toBe('config-leak');
      expect(m?.subcategory).toBe('django-settings');
      expect(m?.template).toBe('django-settings');
    }
  });

  it('does not over-match settings.py lookalikes', () => {
    for (const p of ['/settings.pyc', '/settings.py.bak', '/notsettings.py']) {
      expect(findPatternBait(p)?.subcategory).not.toBe('django-settings');
    }
  });

  it('routes the WebLogic /console/ admin webapp at any depth, incl. bare /console/', () => {
    for (const p of ['/console/', '/console/login', '/console/css/login.css', '/console/foo/bar']) {
      const m = findPatternBait(p);
      expect(m?.category).toBe('cve-recon');
      expect(m?.subcategory).toBe('weblogic');
    }
  });

  it('does not over-match WebLogic /console lookalikes', () => {
    // Bare `/console` without trailing slash is not the admin webapp
    // base; treat it as unmatched (anything else would over-broaden).
    expect(findPatternBait('/console')).toBeUndefined();
    expect(findPatternBait('/consolex')).toBeUndefined();
    expect(findPatternBait('/foo/console/')).toBeUndefined();
  });

  it('routes the Atlassian Jira pom.properties fingerprint path (CVE-2019-8442)', () => {
    for (const p of [
      '/s/abc123/_/;/META-INF/maven/com.atlassian.jira/jira-webapp-dist/pom.properties',
      '/s/8373e26393e21323e2430313/_/;/META-INF/maven/com.atlassian.jira/jira-webapp-dist/pom.properties',
      '/s/x/_/;/META-INF/maven/com.atlassian.jira/jira-webapp-dist/pom.properties',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category).toBe('cve-recon');
      expect(m?.subcategory).toBe('atlassian-jira');
      expect(m?.template).toBe('jira-pom-properties');
    }
  });

  it('does not over-match Atlassian-lookalike paths', () => {
    for (const p of [
      // Missing the bypass ';' segment.
      '/s/abc/_/META-INF/maven/com.atlassian.jira/jira-webapp-dist/pom.properties',
      // Wrong artifactId.
      '/s/abc/_/;/META-INF/maven/com.atlassian.jira/jira-other/pom.properties',
      // Wrong tail.
      '/s/abc/_/;/META-INF/maven/com.atlassian.jira/jira-webapp-dist/pom.xml',
      // Empty token segment.
      '/s//_/;/META-INF/maven/com.atlassian.jira/jira-webapp-dist/pom.properties',
    ]) {
      expect(findPatternBait(p)).toBeUndefined();
    }
  });

  it('matches /.git/* paths', () => {
    expect(findPatternBait('/.git/logs/HEAD')?.category).toBe('config-leak');
  });

  it('returns undefined when no pattern applies', () => {
    expect(findPatternBait('/totally/unrelated')).toBeUndefined();
  });

  it('lists at least the documented number of patterns', () => {
    expect(patternBait.length).toBeGreaterThanOrEqual(10);
  });

  // Completeness guard: every long-standing static pattern is asserted
  // with its full (category, subcategory, template) triplet, so a
  // refactor of one row cannot silently change classification.
  it('routes the pre-existing static patterns to their declared classification', () => {
    const cases: Array<[string, string, string, string]> = [
      ['/wp-content/uploads/x.php', 'webshell', 'wp-content', 'not-found'],
      ['/wp-includes/foo.php', 'webshell', 'wp-includes', 'not-found'],
      ['/cgi-bin/test.cgi', 'cve-recon', 'cgi', 'not-found'],
      ['/admin/shell.php', 'webshell', 'named-shell', 'not-found'],
      ['/_search/all', 'cve-recon', 'elasticsearch', 'not-found'],
      ['/console/login', 'cve-recon', 'weblogic', 'not-found'],
    ];
    for (const [p, cat, sub, tpl] of cases) {
      const m = findPatternBait(p);
      expect(m?.category).toBe(cat);
      expect(m?.subcategory).toBe(sub);
      expect(m?.template).toBe(tpl);
    }
  });
});
