import { describe, expect, it } from 'vitest';
import { findPatternBait, patternBait } from '../../../src/bait/patterns.js';

describe('bait patterns', () => {
  it('matches wp-content PHP uploads', () => {
    expect(findPatternBait('/wp-content/uploads/shell.php')?.category).toBe('webshell');
  });

  it('routes phpMyAdmin directory aliases (bare + /index.php) to the login decoy', () => {
    for (const p of [
      '/pma/',
      '/PMA/',
      '/phpMyAdmin/',
      '/myadmin/',
      '/mysqladmin/',
      '/pma',
      // login-script and version/hyphen-suffixed forms (2026-06-27 sweep)
      '/pma/index.php',
      '/phpmyadmin/index.php',
      '/PMA/index.php',
      '/mysql-admin/index.php',
      '/phpMyAdmin-2/index.php',
      '/phpMyAdmin2/index.php',
      '/phpmyadmin2/index.php',
      '/php-my-admin/index.php',
      '/php-myadmin/index.php',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('cms-auth');
      expect(m?.subcategory, p).toBe('phpmyadmin');
      expect(m?.template, p).toBe('phpmyadmin-login');
    }
    // not an alias — must not match
    for (const p of ['/pmadmin/', '/myadminer/', '/pma/setup/index.php', '/pma/config.php']) {
      expect(findPatternBait(p)?.template, p).not.toBe('phpmyadmin-login');
    }
  });

  it('routes nested adminer.php to the adminer login decoy', () => {
    for (const p of ['/adminer/adminer.php', '/admin/adminer.php', '/tools/db/adminer.php']) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('cms-auth');
      expect(m?.subcategory, p).toBe('adminer');
      expect(m?.template, p).toBe('adminer-login');
    }
  });

  it('routes .svn working-copy metadata: entries decoy, everything else 404', () => {
    const entries = findPatternBait('/.svn/entries');
    expect(entries?.category).toBe('config-leak');
    expect(entries?.subcategory).toBe('svn');
    expect(entries?.template).toBe('fake-svn-entries');
    expect(findPatternBait('/app/.svn/entries')?.template).toBe('fake-svn-entries');
    for (const p of ['/.svn/wc.db', '/.svn/', '/.svn/pristine/ab/abcd.svn-base']) {
      const m = findPatternBait(p);
      expect(m?.subcategory, p).toBe('svn');
      expect(m?.template, p).toBe('not-found');
    }
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
      // php version / underscore-extensionless variants (2026-07-08 sweep)
      '/php_version.php',
      '/php-version.php',
      '/php_info',
      '/phpversion',
      '/php-version',
      '/php_version',
      // name-fuzzing prefixes/suffixes/case (2026-07-15 sweep)
      '/5info.php',
      '/_info.php',
      '/02-info.php',
      '/0.0_phpinfo.php',
      '/00_server_info.php',
      '/.info.php',
      '/__info.php',
      '/infos.php',
      '/1_1_PhpInfo.php',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('config-leak');
      expect(m?.subcategory, p).toBe('phpinfo');
      expect(m?.template, p).toBe('phpinfo');
    }
  });

  it('does not absorb alphabetic-prefixed info lookalikes as phpinfo', () => {
    // the fuzz-prefix class is digits/dots/underscores/hyphens only
    for (const p of ['/userinfo.php', '/businfo.php', '/moreinfo.php']) {
      expect(findPatternBait(p)?.subcategory, p).not.toBe('phpinfo');
    }
  });

  it('serves the git repo config/HEAD at any depth (not just the web root)', () => {
    for (const p of ['/app/.git/config', '/api/.git/config', '/wp-content/.git/config']) {
      expect(findPatternBait(p)?.template, p).toBe('fake-git-config');
    }
    for (const p of ['/app/.git/HEAD', '/staging/.git/HEAD']) {
      expect(findPatternBait(p)?.template, p).toBe('fake-git-head');
    }
    // other .git/ files under a subdir still 404, like the web root
    for (const p of ['/app/.git/index', '/api/.git/refs/heads/main']) {
      const m = findPatternBait(p);
      expect(m?.subcategory, p).toBe('git');
      expect(m?.template, p).toBe('not-found');
    }
  });

  it('routes wp-content/debug.log at any depth to the WP debug-log decoy', () => {
    for (const p of ['/wp-content/debug.log', '/blog/wp-content/debug.log']) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('config-leak');
      expect(m?.subcategory, p).toBe('wordpress');
      expect(m?.template, p).toBe('fake-wp-debug-log');
    }
  });

  it('routes the app runtime-config JSON sweep to the json-config decoy', () => {
    for (const p of [
      '/config.json',
      '/config.production.json',
      '/config.prod.json',
      '/config.local.json',
      '/config.dev.json',
      '/config.development.json',
      '/configs.json',
      '/configuration.json',
      '/settings.json',
      '/production.json',
      '/assets/configs.json',
      '/assets/config.production.json',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('config-leak');
      expect(m?.subcategory, p).toBe('js-config');
      expect(m?.template, p).toBe('fake-json-config');
    }
    // must not swallow other .json manifests (their own entries / unknown)
    for (const p of ['/package.json', '/composer.json', '/swagger.json', '/manifest.json']) {
      expect(findPatternBait(p)?.template, p).not.toBe('fake-json-config');
    }
  });

  it('routes the Nextcloud AppAPI get_log_file traversal-to-passwd to fake-etc-passwd', () => {
    for (const p of [
      '/index.php/apps/app_api/proxy/flow/api/w/nextcloud/jobs_u/get_log_file/..%25252f..%25252fetc%25252fpasswd',
      '/apps/app_api/proxy/x/get_log_file/..%252f..%252fetc%252fpasswd',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('cve-recon');
      expect(m?.subcategory, p).toBe('nextcloud');
      expect(m?.template, p).toBe('fake-etc-passwd');
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

  it('routes leading-double-slash AWS credential bypass paths to the same decoys', () => {
    for (const p of [
      '//.aws/credentials',
      '//home/user/.aws/credentials',
      '//config/.aws/credentials',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('config-leak');
      expect(m?.subcategory, p).toBe('cloud-credentials');
      expect(m?.template, p).toBe('fake-aws-credentials');
    }
    const config = findPatternBait('//.aws/config');
    expect(config?.category).toBe('config-leak');
    expect(config?.subcategory).toBe('aws');
    expect(config?.template).toBe('fake-aws-config');
    // Single-leading-slash behaviour is unchanged.
    expect(findPatternBait('/.aws/credentials')?.template).toBe('fake-aws-credentials');
  });

  it('routes JSON-form AWS credential files at any depth to cloud-credentials', () => {
    for (const p of [
      '/aws-credentials.json',
      '/aws_credentials.json',
      '/config/aws-credentials.json',
      '/home/u/aws-credentials.json',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('config-leak');
      expect(m?.subcategory, p).toBe('cloud-credentials');
      expect(m?.template, p).toBe('fake-aws-credentials-json');
    }
    // Not swept into the GCP service-account JSON decoy.
    expect(findPatternBait('/aws-credentials.json')?.template).not.toBe(
      'fake-gcp-service-account-key',
    );
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

  it('serves .git/config + .git/HEAD, 404s other repo-content, rejects lookalikes', () => {
    // config/HEAD get their decoys (any depth); other repo files still 404.
    expect(findPatternBait('/.git/config')?.template).toBe('fake-git-config');
    expect(findPatternBait('/.git/HEAD')?.template).toBe('fake-git-head');
    expect(findPatternBait('/.git/refs/heads/main')?.template).toBe('not-found');
    expect(findPatternBait('/.git/index')?.template).toBe('not-found');
    for (const p of ['/.gitignorex', '/foo.gitmodules', '/gitignore', '/.gitfoo']) {
      expect(findPatternBait(p)).toBeUndefined();
    }
  });

  it('does not over-match git dotfile lookalikes and leaves .git/ intact', () => {
    expect(findPatternBait('/foo.gitconfig')).toBeUndefined();
    expect(findPatternBait('/gitconfig')).toBeUndefined();
    expect(findPatternBait('/.gitconfigx')).toBeUndefined();
    // The .git/ repo family still routes to the git subcategory.
    expect(findPatternBait('/.git/config')?.subcategory).toBe('git');
    expect(findPatternBait('/.git/config')?.template).toBe('fake-git-config');
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

  it('routes .gitlab-ci.yml at any depth to the GitLab CI decoy', () => {
    for (const p of ['/.gitlab-ci.yml', '/.gitlab-ci.yaml', '/sub/.gitlab-ci.yml']) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('config-leak');
      expect(m?.subcategory, p).toBe('gitlab-ci');
      expect(m?.template, p).toBe('fake-gitlab-ci');
    }
    // not the git-metadata dotfile family
    expect(findPatternBait('/.gitlab-ci.yml')?.subcategory).not.toBe('git');
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

  it('routes any-depth instance/config.py to the Flask config decoy', () => {
    for (const p of ['/instance/config.py', '/app/instance/config.py']) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('config-leak');
      expect(m?.subcategory, p).toBe('flask-config');
      expect(m?.template, p).toBe('flask-config');
    }
  });

  it('routes config/database.php at any depth to the shared PHP DB-config decoy', () => {
    for (const p of ['/config/database.php', '/app/config/database.php']) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('config-leak');
      expect(m?.subcategory, p).toBe('php-db-config');
      expect(m?.template, p).toBe('php-database-config');
    }
  });

  it('routes the generic PHP config-directory basename family to the secrets decoy', () => {
    for (const p of [
      '/config.php',
      '/conf.php',
      '/admin/config.php',
      '/local.config.php',
      '/config/smtp.php',
      '/config/credentials.php',
      '/config/mail.php',
      '/config/mailer.php',
      '/config/email.php',
      '/config/api.php',
      '/config/services.php',
      '/config/keys.php',
      '/config/app.php',
      '/app.php',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('config-leak');
      expect(m?.subcategory, p).toBe('php-config-directory');
      expect(m?.template, p).toBe('fake-php-secrets-config');
    }
    // database.php stays on the higher-fidelity decoy, not this generic one.
    expect(findPatternBait('/config/database.php')?.template).toBe('php-database-config');
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

  it('routes Django Debug Toolbar __debug__ endpoints to the DjDT decoy', () => {
    for (const p of [
      '/__debug__/render_panel/',
      '/__debug__/sql_select/',
      '/__debug__/sql_explain/',
      '/__debug__/template_source/',
      '/__debug__/history_sidebar/',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category).toBe('cve-recon');
      expect(m?.subcategory).toBe('django-debug-toolbar');
      expect(m?.template).toBe('django-debug-toolbar');
    }
  });

  it('does not over-match __debug__ lookalikes', () => {
    // Bare `/__debug__` / `/__debug__/` (no trailing endpoint) and
    // unrelated names must not hit the DjDT decoy.
    for (const p of ['/__debug__', '/__debug__/', '/__debugger__/x', '/debug/default/view']) {
      expect(findPatternBait(p)?.subcategory).not.toBe('django-debug-toolbar');
    }
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

  it('routes the Atlassian /s/<token>/_/; bypass onto WEB-INF/web.xml to the atlassian-webxml decoy', () => {
    for (const p of [
      '/s/vbpkqw/_/;/WEB-INF/web.xml',
      '/s/8373e26393e21323e2430313/_/;/WEB-INF/web.xml',
      '/s/x/_/;/WEB-INF/web.xml',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('cve-recon');
      expect(m?.subcategory, p).toBe('atlassian-webxml');
      expect(m?.template, p).toBe('atlassian-webxml');
    }
  });

  it('404s bare / any-depth WEB-INF/web.xml with no bypass wrapper', () => {
    for (const p of [
      '/WEB-INF/web.xml',
      '/app/WEB-INF/web.xml',
      '/some/deep/path/WEB-INF/web.xml',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('config-leak');
      expect(m?.subcategory, p).toBe('java-webxml');
      expect(m?.template, p).toBe('not-found');
    }
  });

  it('routes Docker Registry V2 tags/list to the docker-registry decoy', () => {
    for (const p of [
      // All 7 observed gap paths (the repositories /v2/_catalog advertises).
      '/v2/app/api/tags/list',
      '/v2/app/web/tags/list',
      '/v2/app/worker/tags/list',
      '/v2/infra/proxy/tags/list',
      '/v2/infra/cron/tags/list',
      '/v2/internal/migrator/tags/list',
      '/v2/staging/api/tags/list',
      // Plus generic single- and deep-segment shapes (guessed repo names).
      '/v2/singlelevel/tags/list',
      '/v2/a/b/c/tags/list',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category).toBe('api-recon');
      expect(m?.subcategory).toBe('docker-registry');
      expect(m?.template).toBe('docker-registry-tags');
    }
  });

  it('does not let the tags/list pattern shadow the /v2/ base, _catalog, or other v2 verbs', () => {
    // `/v2/` and `/v2/_catalog` are explicit catalog entries; manifests and
    // blobs have their own patterns. None end in `/tags/list`, so the
    // tags pattern must leave them all unmatched.
    for (const p of [
      '/v2/',
      '/v2/_catalog',
      '/v2/app/api/manifests/latest',
      '/v2/app/api/blobs/sha256:abc',
      '/v2/tags',
      '/v2/tags/list', // no repository segment
      '/v2/app/api/tags/list/', // trailing slash — `$` anchor must reject
    ]) {
      expect(findPatternBait(p)?.template).not.toBe('docker-registry-tags');
    }
  });

  it('routes Docker Registry V2 blob pulls to the docker-registry-blobs decoy', () => {
    for (const p of [
      // Observed gap paths: per-repo blob fetches by digest.
      '/v2/app/api/blobs/sha256:9b794450f7b6db9c1bb0d9d4e5e7c2a1f0e3d8b76c5a4938271605f4e3d2c1b0',
      '/v2/infra/proxy/blobs/sha256:3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e',
      '/v2/internal/migrator/blobs/sha256:5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a',
      // Generic single- and deep-segment repo shapes.
      '/v2/singlelevel/blobs/sha256:abc',
      '/v2/a/b/c/blobs/sha256:abc',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('api-recon');
      expect(m?.subcategory, p).toBe('docker-registry');
      expect(m?.template, p).toBe('docker-registry-blobs');
    }
    // Distinct /blobs/ suffix: never collides with tags/list or manifests.
    expect(findPatternBait('/v2/app/api/tags/list')?.template).toBe('docker-registry-tags');
    expect(findPatternBait('/v2/app/api/manifests/latest')?.template).toBe(
      'docker-registry-manifests',
    );
  });

  it('matches /.git/* paths', () => {
    expect(findPatternBait('/.git/logs/HEAD')?.category).toBe('config-leak');
  });

  it('routes Confluence AUI Velocity templates to cve-recon/confluence (CVE-2021-26084)', () => {
    for (const p of [
      '/template/aui/text-inline.vm',
      '/template/aui/label.vm',
      '/template/aui/form-aui-message.vm',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category).toBe('cve-recon');
      expect(m?.subcategory).toBe('confluence');
      expect(m?.template).toBe('confluence-text-inline');
    }
  });

  it('does not over-match outside the /template/aui/*.vm shape', () => {
    for (const p of [
      '/template/aui/text-inline.vm/extra',
      '/template/aui/sub/dir.vm',
      '/template/text-inline.vm',
      '/template/aui/text-inline.html',
    ]) {
      expect(findPatternBait(p)?.subcategory).not.toBe('confluence');
    }
  });

  it('routes Symfony Web Profiler paths to cve-recon/symfony-profiler', () => {
    for (const p of [
      '/_profiler',
      '/_profiler/open',
      '/_profiler/a3f9c1',
      '/app_dev.php/_profiler',
      '/app_dev.php/_profiler/open',
      '/web/app_dev.php/_profiler/open',
      '/public/index.php/_profiler',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('cve-recon');
      expect(m?.subcategory, p).toBe('symfony-profiler');
      expect(m?.template, p).toBe('symfony-profiler');
    }
  });

  it('does not over-match non-profiler paths that merely contain the word', () => {
    for (const p of ['/_profiler_foo', '/foo/_profiler', '/profiler', '/api/_profilers']) {
      expect(findPatternBait(p)?.subcategory).not.toBe('symfony-profiler');
    }
  });

  it('routes WordPress plugin user/member enumeration endpoints to wordpress-plugin-users', () => {
    for (const p of [
      '/wp-json/tutor/v1/students',
      '/wp-json/ldlms/v2/users',
      '/wp-json/bbp-api/v1/users',
      '/wp-json/youzer/v1/members',
      '/wp-json/peepso/v1/members',
      '/wp-json/wpuf/v1/users',
      '/wp-json/lp/v1/users',
      '/wp-json/learnpress/v1/users',
      '/wp-json/buddyboss/v1/members',
      '/wp-json/buddypress/v1/members',
      '/wp-json/um/v1/users',
      '/wp-json/ultimate-member/v1/users',
      '/blog/wp-json/buddypress/v1/members', // any-depth prefix
    ]) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('cms-auth');
      expect(m?.subcategory, p).toBe('wordpress-rest-users');
      expect(m?.template, p).toBe('wordpress-plugin-users');
    }
  });

  it('does not match wp-json plugin namespaces outside the allowlist', () => {
    for (const p of ['/wp-json/acme/v1/users', '/wp-json/tutor/v1/courses']) {
      expect(findPatternBait(p)?.template).not.toBe('wordpress-plugin-users');
    }
  });

  it('routes WooCommerce customer collection to the auth-gated 401 decoy', () => {
    for (const p of [
      '/wp-json/wc/v1/customers',
      '/wp-json/wc/v2/customers',
      '/wp-json/wc/v3/customers',
      '/wp-json/wc/v3/customers/', // trailing slash
      '/shop/wp-json/wc/v3/customers', // any-depth prefix
    ]) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('cms-auth');
      expect(m?.subcategory, p).toBe('woocommerce');
      expect(m?.template, p).toBe('woocommerce-customers');
    }
    // Not folded into the public plugin-users roster decoy.
    expect(findPatternBait('/wp-json/wc/v3/customers')?.template).not.toBe(
      'wordpress-plugin-users',
    );
  });

  it('routes MemberPress member collection to the auth-gated 401 decoy', () => {
    for (const p of ['/wp-json/mepr/v1/members', '/blog/wp-json/mepr/v1/members']) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('cms-auth');
      expect(m?.subcategory, p).toBe('memberpress');
      expect(m?.template, p).toBe('memberpress-members');
    }
  });

  it('routes the Rank Math getHead SSRF probe to cve-recon/rankmath', () => {
    for (const p of ['/wp-json/rankmath/v1/getHead', '/sub/wp-json/rankmath/v1/getHead']) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('cve-recon');
      expect(m?.subcategory, p).toBe('rankmath');
      expect(m?.template, p).toBe('rankmath-gethead');
    }
    // Route name is case-sensitive in WP; the lowercase form is not a real route.
    expect(findPatternBait('/wp-json/rankmath/v1/gethead')?.template).not.toBe('rankmath-gethead');
  });

  it('routes the core user sitemap to wordpress-user-sitemap', () => {
    for (const p of ['/wp-sitemap-users-1.xml', '/wp-sitemap-users-2.xml']) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('cms-auth');
      expect(m?.subcategory, p).toBe('wordpress-user-sitemap');
      expect(m?.template, p).toBe('wordpress-user-sitemap');
    }
  });

  it('routes WordPress core REST content collections to wordpress-rest-content', () => {
    for (const p of [
      '/wp-json/wp/v2/posts',
      '/wp-json/wp/v2/comments',
      '/wp-json/wp/v2/media',
      '/wp-json/wp/v2/pages',
      '/wp-json/wp/v2/categories',
      '/wp-json/wp/v2/tags',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('cms-auth');
      expect(m?.subcategory, p).toBe('wordpress-rest-content');
      expect(m?.template, p).toBe('wordpress-rest-content');
    }
  });

  it('routes the wp-json REST index to wordpress-rest-root without shadowing specific routes', () => {
    for (const p of ['/wp-json', '/wp-json/', '/blog/wp-json/']) {
      const m = findPatternBait(p);
      expect(m?.subcategory, p).toBe('wordpress-fingerprint');
      expect(m?.template, p).toBe('wordpress-rest-root');
    }
    // specific routes still win over the index
    expect(findPatternBait('/wp-json/wp/v2/posts')?.template).toBe('wordpress-rest-content');
    expect(findPatternBait('/wp-json/wp/v2/users')?.template).toBe('wordpress-users-api');
  });

  it('routes non-root GraphQL endpoints to the introspection decoy', () => {
    for (const p of ['/api/graphql', '/wp-json/wp/v2/graphql', '/v1/graphql']) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('api-recon');
      expect(m?.subcategory, p).toBe('graphql');
      expect(m?.template, p).toBe('graphql-introspection');
    }
  });

  it('routes WordPress xmlrpc.php at any depth (incl. doubled slash) to the xmlrpc decoy', () => {
    for (const p of ['/blog//xmlrpc.php', '/sub/xmlrpc.php', '/a/b/xmlrpc.php']) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('cms-auth');
      expect(m?.subcategory, p).toBe('wordpress');
      expect(m?.template, p).toBe('wordpress-xmlrpc');
    }
  });

  it('routes wp/v2/users/me to the current-user decoy, distinct from the users collection', () => {
    for (const p of ['/wp-json/wp/v2/users/me', '/blog/wp-json/wp/v2/users/me']) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('cms-auth');
      expect(m?.subcategory, p).toBe('wordpress-rest-users');
      expect(m?.template, p).toBe('wordpress-users-me');
    }
    // the collection endpoint still routes to the list decoy
    expect(findPatternBait('/wp-json/wp/v2/users')?.template).toBe('wordpress-users-api');
    expect(findPatternBait('/wp-json/wp/v2/users/')?.template).toBe('wordpress-users-api');
  });

  it('routes wp/v2/users/<id> to the single-user decoy, distinct from collection and /me', () => {
    for (const p of [
      '/wp-json/wp/v2/users/1',
      '/wp-json/wp/v2/users/10',
      '/blog/wp-json/wp/v2/users/3',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('cms-auth');
      expect(m?.subcategory, p).toBe('wordpress-rest-users');
      expect(m?.template, p).toBe('wordpress-user-by-id');
    }
    // numeric-only id: /me and the bare collection are unaffected
    expect(findPatternBait('/wp-json/wp/v2/users/me')?.template).toBe('wordpress-users-me');
    expect(findPatternBait('/wp-json/wp/v2/users')?.template).toBe('wordpress-users-api');
    // a non-numeric trailing segment is not a single-user pull
    expect(findPatternBait('/wp-json/wp/v2/users/admin')?.template).not.toBe(
      'wordpress-user-by-id',
    );
  });

  it('routes the ownCloud graphapi GetPhpInfo.php (CVE-2023-49103) to the phpinfo decoy', () => {
    for (const p of [
      '/owncloud/apps/graphapi/vendor/microsoft/microsoft-graph/tests/GetPhpInfo.php',
      '/apps/graphapi/vendor/microsoft/microsoft-graph/tests/GetPhpInfo.php',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('cve-recon');
      expect(m?.subcategory, p).toBe('owncloud');
      expect(m?.template, p).toBe('phpinfo');
    }
  });

  it('routes front-end config.js / env*.js (incl. ..;/ traversal) to the js-config decoy', () => {
    for (const p of [
      '/config.js',
      '/app/config.js',
      '/api/config.js',
      '/config/config.js',
      '/web/config.js',
      '/src/config.js',
      '/src/api/config.js',
      '/web/api/config.js',
      '/public/config.js',
      '/public/js/config.js',
      '/static/config.js',
      '/static/js/config.js',
      '/env.js',
      '/env.dev.js',
      '/env.development.js',
      '/env.prod.js',
      '/env.production.js',
      '/..;/env.js',
      '/..;/env.development.js',
      '/..;/env.production.js',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('config-leak');
      expect(m?.subcategory, p).toBe('js-config');
      expect(m?.template, p).toBe('fake-js-config');
    }
  });

  it('does not over-match generic bundles or config.js look-alikes', () => {
    for (const p of [
      '/myconfig.js',
      '/environment.js',
      '/index.js',
      '/main.js',
      '/app.js',
      '/configuration.js',
    ]) {
      expect(findPatternBait(p)?.subcategory, p).not.toBe('js-config');
    }
  });

  it('routes the full FTP/SFTP credential-config sweep to fake-ftp-config', () => {
    for (const p of [
      // base + separators + qualifiers
      '/sftp.json',
      '/ftp.json',
      '/ftps.json',
      '/sftp-config.json',
      '/ftp-config.json',
      '/sftp_config.json',
      '/ftp_config.json',
      '/sftp.config.json',
      '/ftp.config.json',
      '/sftp-settings.json',
      '/ftp_settings.json',
      // non-json extensions
      '/sftp.js',
      '/ftp.config.js',
      '/sftp.yaml',
      '/ftp.yml',
      '/sftp.xml',
      '/ftp.ini',
      '/sftp.conf',
      '/ftp.txt',
      '/ftp.config',
      '/sftp.config',
      // secondary suffixes
      '/sftp.json.example',
      '/ftp.json.dist',
      '/sftp.json.default',
      '/ftp.json.template',
      '/sftp.json.bak1',
      // env / version infixes
      '/sftp.dev.json',
      '/ftp.prod.json',
      '/sftp.staging.json',
      '/ftp.local.json',
      '/sftp-v1.json',
      '/ftp_v2.json',
      '/sftp.1.json',
      '/ftp.2.json',
      // prefixes and dirs
      '/_sftp.json',
      '/.ftp.json',
      '/app.sftp.json',
      '/project.ftp.json',
      '/public/ftp.json',
      '/static/sftp.json',
      // case variants
      '/FTP.json',
      '/Sftp.json',
      '/SFTP-CONFIG.json',
      // bare names and dotfiles (pattern 2)
      '/ftpconfig',
      '/sftpsettings',
      '/.ftprc',
      '/.sftpconfig',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('config-leak');
      expect(m?.subcategory, p).toBe('ftp-credentials');
      expect(m?.template, p).toBe('fake-ftp-config');
    }
  });

  it('does not over-match generic config or non-ftp names', () => {
    for (const p of ['/config.json', '/configuration.json', '/draft.json', '/main.js', '/ftp']) {
      expect(findPatternBait(p)?.subcategory, p).not.toBe('ftp-credentials');
    }
  });

  it('routes PHPUnit eval-stdin.php (CVE-2017-9841) at any depth to its decoy', () => {
    for (const p of [
      '/vendor/phpunit/phpunit/src/Util/PHP/eval-stdin.php',
      '/lib/phpunit/phpunit/src/Util/PHP/eval-stdin.php',
      '/phpunit/src/Util/PHP/eval-stdin.php',
      '/app//vendor/phpunit/phpunit/src/Util/PHP/eval-stdin.php',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('cve-recon');
      expect(m?.subcategory, p).toBe('phpunit');
      expect(m?.template, p).toBe('phpunit-eval-stdin');
    }
  });

  it('does not match eval-stdin.php outside a phpunit path', () => {
    expect(findPatternBait('/src/Util/PHP/eval-stdin.php')?.subcategory).not.toBe('phpunit');
  });

  it('routes Terraform .tfvars variable files at any depth to their decoy', () => {
    for (const p of [
      '/terraform.tfvars',
      '/terraform.tfvars.json',
      '/prod.tfvars',
      '/prod.auto.tfvars',
      '/terraform.auto.tfvars.json',
      '/infra/terraform.tfvars',
      '/deploy/terraform/envs/production/terraform.tfvars',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('config-leak');
      expect(m?.subcategory, p).toBe('terraform');
      expect(m?.template, p).toBe('fake-terraform-tfvars');
    }
  });

  it('does not serve the tfvars decoy for other Terraform artefacts', () => {
    // tfstate is a different format (JSON state, not HCL values) and has no
    // decoy yet; main.tf / variables.tf carry no values worth a decoy.
    for (const p of [
      '/terraform.tfstate',
      '/terraform.tfstate.backup',
      '/main.tf',
      '/variables.tf',
    ]) {
      expect(findPatternBait(p)?.template, p).not.toBe('fake-terraform-tfvars');
    }
  });

  it('routes serverless.yml at any depth to the Serverless Framework decoy', () => {
    for (const p of ['/serverless.yml', '/serverless.yaml', '/api/serverless.yml']) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('config-leak');
      expect(m?.subcategory, p).toBe('serverless-framework');
      expect(m?.template, p).toBe('serverless-yml');
    }
  });

  it('routes .github/workflows/*.yml at any depth to the Actions workflow decoy', () => {
    for (const p of [
      '/.github/workflows/deploy.yml',
      '/.github/workflows/ci.yaml',
      '/.github/workflows/release-please.yml',
      '/app/.github/workflows/deploy.yml',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('config-leak');
      expect(m?.subcategory, p).toBe('github-actions');
      expect(m?.template, p).toBe('fake-github-workflow');
    }
  });

  it('does not confuse .github/ with the .git/ repo-metadata family', () => {
    // .github is a normal directory; only workflow YAML under it is baited.
    expect(findPatternBait('/.github/dependabot.yml')).toBeUndefined();
    expect(findPatternBait('/.github/workflows/')).toBeUndefined();
    expect(findPatternBait('/.github/workflows/deploy.yml')?.subcategory).not.toBe('git');
  });

  it('routes the camelCase GCP service-account key basenames to the key decoy', () => {
    for (const p of [
      '/serviceAccountKey.json',
      '/serviceAccount.json',
      '/config/serviceAccountKey.json',
      // pre-existing spellings must keep working
      '/service-account.json',
      '/firebase-adminsdk.json',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('config-leak');
      expect(m?.subcategory, p).toBe('cloud-credentials');
      expect(m?.template, p).toBe('fake-gcp-service-account-key');
    }
  });

  it('routes Django split-settings modules to the settings.py decoy', () => {
    for (const p of [
      '/settings.py',
      '/local_settings.py',
      '/settings_local.py',
      '/prod_settings.py',
      '/base_settings.py',
      '/config/local_settings.py',
      '/myproject/settings.py',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('config-leak');
      expect(m?.subcategory, p).toBe('django-settings');
      expect(m?.template, p).toBe('django-settings');
    }
  });

  it('keeps the settings.py affix list closed', () => {
    for (const p of ['/user_settings.py', '/mysettings.py', '/settings_backup.py']) {
      expect(findPatternBait(p)?.template, p).not.toBe('django-settings');
    }
  });

  it('routes env.json to the runtime JSON-config decoy', () => {
    for (const p of ['/env.json', '/env.prod.json', '/assets/env.json', '/ENV.json']) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('config-leak');
      expect(m?.subcategory, p).toBe('js-config');
      expect(m?.template, p).toBe('fake-json-config');
    }
  });

  it('routes the .sql dump sweep to the mysqldump decoy', () => {
    for (const p of [
      '/database.sql',
      '/backup.sql',
      '/dump.sql',
      '/db.sql',
      '/db_backup.sql',
      '/site.sql',
      '/website.sql',
      '/data.sql',
      '/mysql.sql',
      '/backup/database.sql',
      '/backup/dump.sql',
      '/bak/database.sql',
      '/wp-content/mysql.sql',
      '/DATABASE.SQL',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('config-leak');
      expect(m?.subcategory, p).toBe('sql-dump');
      expect(m?.template, p).toBe('fake-sql-dump');
    }
  });

  it('classifies the site-archive sweep without serving an archive', () => {
    for (const p of [
      '/backup.tar.gz',
      '/site.tar.gz',
      '/html.tar.gz',
      '/public_html.tar.gz',
      '/www.tar.gz',
      '/htdocs.tar.gz',
      '/backup.zip',
      '/site.zip',
      '/web.zip',
      '/releases/app.tgz',
      '/dump.tar.bz2',
      '/archive.7z',
      // A compressed dump is an archive first — policy §A.4 bars serving it.
      '/backup.sql.gz',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('config-leak');
      expect(m?.subcategory, p).toBe('site-archive');
      expect(m?.template, p).toBe('not-found');
    }
  });

  it('routes each CI/CD pipeline product to its own subcategory', () => {
    const cases: Array<[string, string]> = [
      ['/.travis.yml', 'travis-ci'],
      ['/.travis.yaml', 'travis-ci'],
      ['/.circleci/config.yml', 'circleci'],
      ['/.circleci/config.yaml', 'circleci'],
      ['/.drone.yml', 'drone-ci'],
      ['/.drone.yaml', 'drone-ci'],
      ['/bitbucket-pipelines.yml', 'bitbucket-pipelines'],
      ['/bitbucket-pipelines.yaml', 'bitbucket-pipelines'],
      ['/.buildkite/pipeline.yml', 'buildkite'],
      ['/.buildkite/pipeline.yaml', 'buildkite'],
      ['/.buildkite/pipeline.staging.yml', 'buildkite'],
      ['/azure-pipelines.yml', 'azure-pipelines'],
      ['/.azure-pipelines.yml', 'azure-pipelines'],
      ['/azure-pipelines.release.yml', 'azure-pipelines'],
    ];
    for (const [p, sub] of cases) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('config-leak');
      expect(m?.subcategory, p).toBe(sub);
      expect(m?.template, p).toBe('fake-ci-pipeline');
    }
  });

  it('routes the non-YAML repo artifacts to their own decoys', () => {
    const cases: Array<[string, string, string]> = [
      ['/Jenkinsfile', 'jenkins', 'fake-jenkinsfile'],
      ['/jenkinsfile', 'jenkins', 'fake-jenkinsfile'],
      ['/Jenkinsfile.release', 'jenkins', 'fake-jenkinsfile'],
      ['/Dockerfile', 'dockerfile', 'fake-dockerfile'],
      ['/Dockerfile.prod', 'dockerfile', 'fake-dockerfile'],
      ['/docker/Dockerfile', 'dockerfile', 'fake-dockerfile'],
      ['/Makefile', 'makefile', 'fake-makefile'],
      ['/makefile', 'makefile', 'fake-makefile'],
      ['/GNUmakefile', 'makefile', 'fake-makefile'],
      ['/Procfile', 'procfile', 'fake-procfile'],
      ['/Procfile.dev', 'procfile', 'fake-procfile'],
      ['/app.yaml', 'gae-app-yaml', 'fake-gae-app-yaml'],
      ['/app.yml', 'gae-app-yaml', 'fake-gae-app-yaml'],
      ['/deploy.sh', 'deploy-script', 'fake-deploy-script'],
      ['/release.sh', 'deploy-script', 'fake-deploy-script'],
      ['/bin/deploy.bash', 'deploy-script', 'fake-deploy-script'],
      ['/docker-entrypoint.sh', 'deploy-script', 'fake-deploy-script'],
    ];
    for (const [p, sub, tpl] of cases) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('config-leak');
      expect(m?.subcategory, p).toBe(sub);
      expect(m?.template, p).toBe(tpl);
    }
  });

  it('keeps the CI/repo-artifact entries off neighbouring products', () => {
    // Spring's application.yml, the Serverless/docker-compose configs, and the
    // two pre-existing CI decoys must all keep their own templates.
    const untouched: Array<[string, string]> = [
      ['/application.yml', 'spring-application-yml'],
      ['/config/application.yaml', 'spring-application-yml'],
      ['/serverless.yml', 'serverless-yml'],
      ['/docker-compose.yml', 'docker-compose-yml'],
      ['/.gitlab-ci.yml', 'fake-gitlab-ci'],
      ['/.github/workflows/deploy.yml', 'fake-github-workflow'],
    ];
    for (const [p, tpl] of untouched) {
      expect(findPatternBait(p)?.template, p).toBe(tpl);
    }
    // Arbitrary shell scripts stay outside the deploy-script allowlist.
    for (const p of ['/backup.sh', '/foo.sh', '/scripts/cleanup.sh']) {
      expect(findPatternBait(p)?.subcategory, p).not.toBe('deploy-script');
    }
  });

  it('routes dotless env templates to the dotenv decoy', () => {
    for (const p of [
      '/env.example',
      '/env.sample',
      '/env.dist',
      '/env-template',
      '/env_local',
      '/config/env.production',
      '/ENV.EXAMPLE',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('config-leak');
      expect(m?.subcategory, p).toBe('dotenv-variant');
      expect(m?.template, p).toBe('fake-env');
    }
    // The suffix allowlist stays closed and must not steal the JS/JSON configs.
    expect(findPatternBait('/env.js')?.template).toBe('fake-js-config');
    expect(findPatternBait('/env.prod.js')?.template).toBe('fake-js-config');
    expect(findPatternBait('/env.json')?.template).toBe('fake-json-config');
    expect(findPatternBait('/environment')).toBeUndefined();
  });

  it('routes .envrc to the direnv decoy', () => {
    for (const p of ['/.envrc', '/app/.envrc', '/srv/www/app/.envrc']) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('config-leak');
      expect(m?.subcategory, p).toBe('direnv');
      expect(m?.template, p).toBe('fake-envrc');
    }
    // Must not disturb the .env family it sits next to.
    expect(findPatternBait('/.env')?.subcategory).toBe('dotenv');
    expect(findPatternBait('/.env.production')?.subcategory).toBe('dotenv-variant');
  });

  it('splits shell rc files from shell history files', () => {
    for (const p of [
      '/.bashrc',
      '/.bash_profile',
      '/.profile',
      '/.zshrc',
      '/.zprofile',
      '/home/deploy/.bashrc',
      '/root/.bash_aliases',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('config-leak');
      expect(m?.subcategory, p).toBe('shell-rc');
      expect(m?.template, p).toBe('fake-shell-rc');
    }
    for (const p of [
      '/.bash_history',
      '/.zsh_history',
      '/.mysql_history',
      '/.psql_history',
      '/root/.bash_history',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category, p).toBe('config-leak');
      expect(m?.subcategory, p).toBe('shell-history');
      expect(m?.template, p).toBe('fake-shell-history');
    }
    // The filename allowlist is closed, and the neighbouring home-directory
    // dotfiles keep their own credential decoys.
    expect(findPatternBait('/.bashrc_old')?.subcategory).not.toBe('shell-rc');
    expect(findPatternBait('/.netrc')?.template).toBe('fake-netrc');
    expect(findPatternBait('/.npmrc')?.template).toBe('fake-npmrc');
    expect(findPatternBait('/.gitconfig')?.template).toBe('fake-gitconfig');
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
