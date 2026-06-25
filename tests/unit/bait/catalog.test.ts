import { describe, expect, it } from 'vitest';
import { explicitBait, findExplicitBait } from '../../../src/bait/catalog.js';

describe('bait catalog', () => {
  it('finds an explicit bait entry by exact path', () => {
    const entry = findExplicitBait('/wp-login.php');
    expect(entry).toBeDefined();
    expect(entry?.category).toBe('cms-auth');
    expect(entry?.subcategory).toBe('wordpress');
    expect(entry?.template).toBe('wordpress-login');
  });

  it('returns undefined for unknown paths', () => {
    expect(findExplicitBait('/no-such-path')).toBeUndefined();
  });

  it('uses exact-path matching (does not match prefixes)', () => {
    expect(findExplicitBait('/wp-login.php/extra')).toBeUndefined();
  });

  it('exposes a stable set of expected paths', () => {
    const paths = explicitBait.map((b) => b.path);
    expect(paths).toContain('/wp-login.php');
    expect(paths).toContain('/.env');
    expect(paths).toContain('/actuator/health');
    expect(paths).toContain('/latest/meta-data/iam/security-credentials/');
    expect(paths).toContain('/swagger.json');
    expect(paths).toContain('/HNAP1/');
  });

  it('routes /mcp to the mcp decoy', () => {
    const entry = findExplicitBait('/mcp');
    expect(entry?.category).toBe('mcp-recon');
    expect(entry?.subcategory).toBe('mcp');
    expect(entry?.template).toBe('mcp');
  });

  it('routes the bare /env probe to the dotenv decoy', () => {
    const entry = findExplicitBait('/env');
    expect(entry?.category).toBe('config-leak');
    expect(entry?.subcategory).toBe('dotenv');
    expect(entry?.template).toBe('fake-env');
  });

  it('routes the WordPress sitemap index to its decoy', () => {
    const entry = findExplicitBait('/wp-sitemap.xml');
    expect(entry?.category).toBe('cms-auth');
    expect(entry?.subcategory).toBe('wordpress-fingerprint');
    expect(entry?.template).toBe('wordpress-sitemap-index');
  });

  it('routes /package.json to the Node manifest decoy', () => {
    const entry = findExplicitBait('/package.json');
    expect(entry?.category).toBe('config-leak');
    expect(entry?.subcategory).toBe('js-package-manifest');
    expect(entry?.template).toBe('fake-package-json');
  });

  it('routes Adminer paths to the adminer login decoy', () => {
    for (const p of ['/adminer.php', '/adminer/']) {
      const entry = findExplicitBait(p);
      expect(entry?.category, p).toBe('cms-auth');
      expect(entry?.subcategory, p).toBe('adminer');
      expect(entry?.template, p).toBe('adminer-login');
    }
  });

  it('routes the Gravity SMTP CVE-2026-4020 endpoint to its decoy', () => {
    const entry = findExplicitBait('/wp-json/gravitysmtp/v1/tests/mock-data');
    expect(entry?.category).toBe('cve-recon');
    expect(entry?.subcategory).toBe('gravity-smtp');
    expect(entry?.template).toBe('gravity-smtp-system-report');
  });

  it('routes /.vscode/sftp.json to the VS Code SFTP credentials decoy', () => {
    const entry = findExplicitBait('/.vscode/sftp.json');
    expect(entry?.category).toBe('config-leak');
    expect(entry?.subcategory).toBe('editor-credentials');
    expect(entry?.template).toBe('fake-vscode-sftp');
  });

  it('routes /trace.axd to the ASP.NET trace decoy', () => {
    const entry = findExplicitBait('/trace.axd');
    expect(entry?.category).toBe('cve-recon');
    expect(entry?.subcategory).toBe('aspnet-trace');
    expect(entry?.template).toBe('aspnet-trace');
  });

  it('routes /login.action to the Struts decoy', () => {
    const entry = findExplicitBait('/login.action');
    expect(entry?.category).toBe('cve-recon');
    expect(entry?.subcategory).toBe('struts');
    expect(entry?.template).toBe('struts-login-action');
  });

  it('routes /telescope/requests to the Laravel Telescope decoy', () => {
    const entry = findExplicitBait('/telescope/requests');
    expect(entry?.category).toBe('cve-recon');
    expect(entry?.subcategory).toBe('laravel-telescope');
    expect(entry?.template).toBe('laravel-telescope');
  });

  it('routes the Exchange ClickOnce exporttool path to its decoy', () => {
    const entry = findExplicitBait(
      '/ecp/Current/exporttool/microsoft.exchange.ediscovery.exporttool.application',
    );
    expect(entry?.category).toBe('cve-recon');
    expect(entry?.subcategory).toBe('exchange');
    expect(entry?.template).toBe('exchange-exporttool');
  });

  it('routes the Swagger UI HTML variants to the swagger-ui-html decoy', () => {
    for (const path of [
      '/swagger-ui.html',
      '/swagger/index.html',
      '/swagger/swagger-ui.html',
      '/webjars/swagger-ui/index.html',
    ]) {
      const entry = findExplicitBait(path);
      expect(entry?.category).toBe('api-recon');
      expect(entry?.subcategory).toBe('openapi');
      expect(entry?.template).toBe('swagger-ui-html');
    }
  });

  it('routes /v2/_catalog to the Docker Registry decoy', () => {
    const entry = findExplicitBait('/v2/_catalog');
    expect(entry?.category).toBe('api-recon');
    expect(entry?.subcategory).toBe('docker-registry');
    expect(entry?.template).toBe('docker-registry-catalog');
  });

  it('routes the Docker Registry V2 base probe (/v2/ and /v2) to the base decoy', () => {
    for (const path of ['/v2/', '/v2']) {
      const entry = findExplicitBait(path);
      expect(entry?.category).toBe('api-recon');
      expect(entry?.subcategory).toBe('docker-registry');
      expect(entry?.template).toBe('docker-registry-base');
    }
  });

  it('routes /debug/default/view to the Yii2 Debug Toolbar decoy', () => {
    const entry = findExplicitBait('/debug/default/view');
    expect(entry?.category).toBe('cve-recon');
    expect(entry?.subcategory).toBe('yii2-debug');
    expect(entry?.template).toBe('yii2-debug');
  });

  it('routes /___proxy_subdomain_cpanel to the cPanel login decoy', () => {
    const entry = findExplicitBait('/___proxy_subdomain_cpanel');
    expect(entry?.category).toBe('cms-auth');
    expect(entry?.subcategory).toBe('cpanel');
    expect(entry?.template).toBe('cpanel-login');
  });

  it('routes the cPanel proxy /login path to the cPanel login decoy', () => {
    const entry = findExplicitBait('/___proxy_subdomain_cpanel/login');
    expect(entry?.category).toBe('cms-auth');
    expect(entry?.subcategory).toBe('cpanel');
    expect(entry?.template).toBe('cpanel-login');
  });

  it('routes /openid_connect/cpanelid to the cPanel login decoy', () => {
    const entry = findExplicitBait('/openid_connect/cpanelid');
    expect(entry?.category).toBe('cms-auth');
    expect(entry?.subcategory).toBe('cpanel');
    expect(entry?.template).toBe('cpanel-login');
  });

  it('routes the cPanel login form POST target /login (and /login/) to the cPanel decoy', () => {
    for (const path of ['/login', '/login/']) {
      const entry = findExplicitBait(path);
      expect(entry?.category).toBe('cms-auth');
      expect(entry?.subcategory).toBe('cpanel');
      expect(entry?.template).toBe('cpanel-login');
    }
  });

  it('routes the Jira dashboard and login.jsp to the Jira login decoy', () => {
    for (const path of ['/secure/Dashboard.jspa', '/login.jsp']) {
      const entry = findExplicitBait(path);
      expect(entry?.category).toBe('cms-auth');
      expect(entry?.subcategory).toBe('atlassian-jira');
      expect(entry?.template).toBe('jira-login');
    }
  });

  it('routes /___proxy_subdomain_whm/login to the WHM login decoy', () => {
    const entry = findExplicitBait('/___proxy_subdomain_whm/login');
    expect(entry?.category).toBe('cms-auth');
    expect(entry?.subcategory).toBe('whm');
    expect(entry?.template).toBe('whm-login');
  });

  it('routes the bare /whm path (and trailing slash) to the WHM login decoy', () => {
    for (const path of ['/whm', '/whm/']) {
      const entry = findExplicitBait(path);
      expect(entry?.category).toBe('cms-auth');
      expect(entry?.subcategory).toBe('whm');
      expect(entry?.template).toBe('whm-login');
    }
  });

  it('routes /web.config to the ASP.NET web.config decoy', () => {
    const entry = findExplicitBait('/web.config');
    expect(entry?.category).toBe('config-leak');
    expect(entry?.subcategory).toBe('aspnet-config');
    expect(entry?.template).toBe('aspnet-web-config');
  });

  it('routes /appsettings.json to the .NET Core appsettings decoy', () => {
    const entry = findExplicitBait('/appsettings.json');
    expect(entry?.category).toBe('config-leak');
    expect(entry?.subcategory).toBe('aspnet-config');
    expect(entry?.template).toBe('dotnet-appsettings');
  });

  it('routes /configuration.php to the Joomla configuration.php decoy', () => {
    const entry = findExplicitBait('/configuration.php');
    expect(entry?.category).toBe('config-leak');
    expect(entry?.subcategory).toBe('joomla-config');
    expect(entry?.template).toBe('joomla-configuration-php');
  });

  it('routes /settings.php to the Drupal settings.php decoy', () => {
    const entry = findExplicitBait('/settings.php');
    expect(entry?.category).toBe('config-leak');
    expect(entry?.subcategory).toBe('drupal-config');
    expect(entry?.template).toBe('drupal-settings-php');
  });

  it('routes /database.php and /db.php to the shared PHP DB-config decoy', () => {
    for (const path of ['/database.php', '/db.php']) {
      const entry = findExplicitBait(path);
      expect(entry?.category).toBe('config-leak');
      expect(entry?.subcategory).toBe('php-db-config');
      expect(entry?.template).toBe('php-database-config');
    }
  });

  it('routes /composer.json to the PHP package-manifest decoy', () => {
    const entry = findExplicitBait('/composer.json');
    expect(entry?.category).toBe('config-leak');
    expect(entry?.subcategory).toBe('php-package-manifest');
    expect(entry?.template).toBe('composer-json');
  });

  it('routes /author-sitemap.xml to the WordPress user-sitemap decoy', () => {
    const entry = findExplicitBait('/author-sitemap.xml');
    expect(entry?.category).toBe('cms-auth');
    expect(entry?.subcategory).toBe('wordpress-user-sitemap');
    expect(entry?.template).toBe('wordpress-user-sitemap');
  });

  it('has no duplicate paths', () => {
    const paths = explicitBait.map((b) => b.path);
    expect(new Set(paths).size).toBe(paths.length);
  });
});
