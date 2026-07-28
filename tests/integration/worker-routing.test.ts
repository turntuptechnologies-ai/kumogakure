import { SELF } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

describe('Worker routing', () => {
  it('returns the not-found stub for unmatched paths', async () => {
    const response = await SELF.fetch('http://example.test/this-path-is-unknown');
    expect(response.status).toBe(404);
    const body = await response.text();
    expect(body).toBe('Not Found');
  });

  it('serves the wordpress-login template at /wp-login.php', async () => {
    const response = await SELF.fetch('http://example.test/wp-login.php');
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('name="log"');
    expect(html).toContain('name="pwd"');
  });

  it('overrides Server and X-Powered-By via the fingerprint layer', async () => {
    const response = await SELF.fetch('http://example.test/wp-login.php');
    const server = response.headers.get('Server');
    expect(server).toBeTruthy();
    expect(server).not.toContain('cloudflare');
    expect(response.headers.get('X-Powered-By')).toContain('PHP');
  });

  it('uses the spring-actuator-generic template for unmatched /actuator/* paths', async () => {
    const response = await SELF.fetch('http://example.test/actuator/beans');
    expect(response.status).toBe(404);
    const json = (await response.json()) as { error: string; path: string };
    expect(json.error).toBe('Not Found');
    expect(json.path).toBe('/actuator/beans');
  });

  it('captures POST bodies up to the configured limit without buffering oversize payloads', async () => {
    const oversized = 'A'.repeat(200_000);
    const response = await SELF.fetch('http://example.test/wp-login.php', {
      method: 'POST',
      body: oversized,
    });
    expect(response.status).toBe(200);
  });

  it('answers the Docker Registry V2 base version probe at /v2/', async () => {
    const response = await SELF.fetch('http://example.test/v2/');
    expect(response.status).toBe(200);
    expect(response.headers.get('docker-distribution-api-version')).toBe('registry/2.0');
  });

  it('serves Docker Registry tag lists for advertised repositories', async () => {
    const response = await SELF.fetch('http://example.test/v2/app/api/tags/list');
    expect(response.status).toBe(200);
    expect(response.headers.get('docker-distribution-api-version')).toBe('registry/2.0');
    const json = (await response.json()) as { name: string; tags: string[] };
    expect(json.name).toBe('app/api');
    expect(json.tags).toContain('latest');
  });

  it('returns NAME_UNKNOWN for Docker repositories that are not advertised', async () => {
    const response = await SELF.fetch('http://example.test/v2/no/such-repo/tags/list');
    expect(response.status).toBe(404);
    const json = (await response.json()) as { errors: Array<{ code: string }> };
    expect(json.errors[0].code).toBe('NAME_UNKNOWN');
  });

  it('serves a schema-2 manifest for an advertised Docker tag', async () => {
    const response = await SELF.fetch('http://example.test/v2/app/api/manifests/latest');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe(
      'application/vnd.docker.distribution.manifest.v2+json',
    );
    expect(response.headers.get('docker-content-digest')).toMatch(/^sha256:[0-9a-f]{64}$/);
    const json = (await response.json()) as { schemaVersion: number; layers: unknown[] };
    expect(json.schemaVersion).toBe(2);
    expect(json.layers.length).toBeGreaterThan(0);
  });

  it('returns MANIFEST_UNKNOWN for a Docker tag that is not advertised', async () => {
    const response = await SELF.fetch('http://example.test/v2/app/api/manifests/v9.9.9');
    expect(response.status).toBe(404);
    const json = (await response.json()) as { errors: Array<{ code: string }> };
    expect(json.errors[0].code).toBe('MANIFEST_UNKNOWN');
  });

  it('serves the image config blob a manifest points to (full registry walk)', async () => {
    const manifest = (await (
      await SELF.fetch('http://example.test/v2/app/api/manifests/latest')
    ).json()) as { config: { digest: string } };
    const blob = await SELF.fetch(`http://example.test/v2/app/api/blobs/${manifest.config.digest}`);
    expect(blob.status).toBe(200);
    expect(blob.headers.get('content-type')).toBe('application/vnd.docker.container.image.v1+json');
    const cfg = (await blob.json()) as { config: { Env: string[] } };
    expect(Array.isArray(cfg.config.Env)).toBe(true);
  });

  it('returns BLOB_UNKNOWN for a Docker blob digest that is not advertised', async () => {
    const response = await SELF.fetch(
      'http://example.test/v2/app/api/blobs/sha256:deadbeef00000000000000000000000000000000000000000000000000000000',
    );
    expect(response.status).toBe(404);
    const json = (await response.json()) as { errors: Array<{ code: string }> };
    expect(json.errors[0].code).toBe('BLOB_UNKNOWN');
  });

  it('serves the GraphQL introspection decoy for a non-root graphql mount', async () => {
    const response = await SELF.fetch('http://example.test/api/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{__schema{queryType{name}}}' }),
    });
    expect(response.status).toBe(200);
    const json = (await response.json()) as { data?: { __schema?: unknown } };
    expect(json.data?.__schema).toBeDefined();
  });

  it('serves the xmlrpc decoy for a doubled-slash subdir path', async () => {
    const response = await SELF.fetch('http://example.test/blog//xmlrpc.php', { method: 'POST' });
    expect(response.status).toBe(200);
  });

  it('serves the FTP/SFTP credential decoy across naming/format variants', async () => {
    const json = await SELF.fetch('http://example.test/sftp.json');
    expect(json.status).toBe(200);
    expect(((await json.json()) as { password: string }).password).toBe('REDACTED_FOR_HONEYPOT');

    const yaml = await SELF.fetch('http://example.test/ftp.prod.yml');
    expect(yaml.status).toBe(200);
    expect(yaml.headers.get('content-type')).toContain('yaml');

    const dotfile = await SELF.fetch('http://example.test/.ftpconfig');
    expect(dotfile.status).toBe(200);
  });

  it('serves the js-config decoy for /config.js and the ..;/ traversal env form', async () => {
    const cfg = await SELF.fetch('http://example.test/config.js');
    expect(cfg.status).toBe(200);
    expect(cfg.headers.get('content-type')).toContain('javascript');
    expect(await cfg.text()).toContain('__APP_CONFIG__');

    const env = await SELF.fetch('http://example.test/..;/env.js');
    expect(env.status).toBe(200);
    expect(await env.text()).toContain('apiBaseUrl');
  });

  it('captures the PHPUnit eval-stdin RCE probe with an empty 200 (no execution)', async () => {
    const response = await SELF.fetch(
      'http://example.test/vendor/phpunit/phpunit/src/Util/PHP/eval-stdin.php',
      { method: 'POST', body: '<?php echo md5("pwned"); ?>' },
    );
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).not.toContain('a6e1a972a0c0fa1bc5d8d9d4f3f3f8a3');
  });

  it('serves the phpinfo decoy for the ownCloud graphapi CVE-2023-49103 path', async () => {
    const response = await SELF.fetch(
      'http://example.test/owncloud/apps/graphapi/vendor/microsoft/microsoft-graph/tests/GetPhpInfo.php',
    );
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html.toLowerCase()).toContain('phpinfo');
  });

  it('returns the WordPress 401 rest_not_logged_in decoy for wp/v2/users/me', async () => {
    const response = await SELF.fetch('http://example.test/wp-json/wp/v2/users/me');
    expect(response.status).toBe(401);
    const json = (await response.json()) as { code: string };
    expect(json.code).toBe('rest_not_logged_in');
  });

  it('serves a coherent single user for an advertised id and rest_user_invalid_id otherwise', async () => {
    const valid = await SELF.fetch('http://example.test/wp-json/wp/v2/users/1');
    expect(valid.status).toBe(200);
    expect(((await valid.json()) as { id: number }).id).toBe(1);

    const invalid = await SELF.fetch('http://example.test/wp-json/wp/v2/users/10');
    expect(invalid.status).toBe(404);
    expect(((await invalid.json()) as { code: string }).code).toBe('rest_user_invalid_id');
  });

  it('serves the WordPress sitemap index pointing at the user sub-sitemap', async () => {
    const response = await SELF.fetch('http://example.test/wp-sitemap.xml');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('xml');
    expect(await response.text()).toContain('wp-sitemap-users-1.xml');
  });

  it('serves the WordPress REST content decoy for wp/v2/posts', async () => {
    const response = await SELF.fetch('http://example.test/wp-json/wp/v2/posts');
    expect(response.status).toBe(200);
    const posts = (await response.json()) as Array<{ author: number }>;
    expect(posts[0]?.author).toBe(1);
  });

  it('serves the WordPress REST index decoy at /wp-json/', async () => {
    const response = await SELF.fetch('http://example.test/wp-json/');
    expect(response.status).toBe(200);
    const index = (await response.json()) as { namespaces: string[] };
    expect(index.namespaces).toContain('wp/v2');
  });

  it('serves the plugin user-enumeration decoy for a membership-plugin REST route', async () => {
    const response = await SELF.fetch('http://example.test/wp-json/buddypress/v1/members');
    expect(response.status).toBe(200);
    const list = (await response.json()) as Array<{ slug: string }>;
    expect(list.map((m) => m.slug)).toContain('editor');
  });

  it('serves the user-sitemap decoy at /wp-sitemap-users-1.xml', async () => {
    const response = await SELF.fetch('http://example.test/wp-sitemap-users-1.xml');
    expect(response.status).toBe(200);
    const xml = await response.text();
    expect(xml).toContain('/author/editor/');
  });

  it('serves the Next.js Server Action decoy when the Next-Action header is present', async () => {
    const response = await SELF.fetch('http://example.test/', {
      method: 'POST',
      headers: {
        'next-action': '8eb0e5ed8819659b579d2bda3de1ddd5f0b59413',
        'content-type': 'text/plain',
      },
      body: 'x',
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/x-component');
    expect(await response.text()).toMatch(/^0:\{/);
  });

  it('lets a known path win over the Next-Action header (path matched first)', async () => {
    const response = await SELF.fetch('http://example.test/wp-login.php', {
      method: 'POST',
      headers: { 'next-action': 'abc' },
      body: 'x',
    });
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('name="log"'); // wordpress-login, not the nextjs decoy
  });

  it('serves the WHM login decoy at the bare /whm path', async () => {
    const response = await SELF.fetch('http://example.test/whm');
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html.length).toBeGreaterThan(0);
  });

  it('serves the Jira login decoy at /secure/Dashboard.jspa', async () => {
    const response = await SELF.fetch('http://example.test/secure/Dashboard.jspa');
    expect(response.status).toBe(200);
    expect(response.headers.get('x-ausername')).toBe('anonymous');
    const html = await response.text();
    expect(html).toContain('name="os_username"');
  });

  it('serves the Symfony Web Profiler decoy for a sprayed dev-controller path', async () => {
    const response = await SELF.fetch('http://example.test/web/app_dev.php/_profiler/open');
    expect(response.status).toBe(200);
    expect(response.headers.get('x-debug-token')).toBeTruthy();
    const html = await response.text();
    expect(html).toContain('Symfony Profiler');
  });

  it('serves the Confluence AUI decoy and captures the OGNL probe without reflecting it', async () => {
    const payload = "x'%2b#{233*157}%2b'";
    const response = await SELF.fetch('http://example.test/template/aui/text-inline.vm', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: `queryString=${payload}`,
    });
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('aui-inline-edit');
    expect(html).not.toContain('36581');
  });

  // Regression guard for the wiring added in #71: index.ts must pass
  // the already-read request body into TemplateContext, otherwise the
  // mcp / gravity-smtp templates have nothing to branch on. The mcp
  // template parses JSON-RPC out of ctx.body — if body is missing it
  // would 400 instead of returning a result. Unit tests construct ctx
  // with body directly, so this end-to-end path is only covered here.
  it('propagates the POST body to ctx.body (mcp decoy returns serverInfo for initialize)', async () => {
    const initialize = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2025-03-26', clientInfo: { name: 'test' }, capabilities: {} },
    });
    const response = await SELF.fetch('http://example.test/mcp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: initialize,
    });
    expect(response.status).toBe(200);
    const json = (await response.json()) as {
      id: number;
      result: { serverInfo: { name: string }; protocolVersion: string };
    };
    expect(json.id).toBe(1);
    expect(json.result.serverInfo.name).toBe('ops-mcp-gateway');
    expect(json.result.protocolVersion).toBe('2025-03-26');
  });

  it('serves the authentic 401 for the WooCommerce customer collection', async () => {
    const response = await SELF.fetch('http://example.test/wp-json/wc/v3/customers');
    expect(response.status).toBe(401);
    const json = (await response.json()) as { code: string };
    expect(json.code).toBe('woocommerce_rest_cannot_view');
  });

  it('serves the authentic 401 for the MemberPress member collection', async () => {
    const response = await SELF.fetch('http://example.test/wp-json/mepr/v1/members');
    expect(response.status).toBe(401);
    const json = (await response.json()) as { code: string };
    expect(json.code).toBe('rest_forbidden');
  });

  it('mirrors the missing-param 400 for the Rank Math getHead SSRF probe', async () => {
    const response = await SELF.fetch('http://example.test/wp-json/rankmath/v1/getHead');
    expect(response.status).toBe(400);
    const json = (await response.json()) as { code: string };
    expect(json.code).toBe('rest_missing_callback_param');
  });

  it('serves the Node manifest decoy at /package.json', async () => {
    const response = await SELF.fetch('http://example.test/package.json');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const json = (await response.json()) as { dependencies: Record<string, string> };
    expect(Object.keys(json.dependencies).length).toBeGreaterThan(0);
  });

  it('serves the Adminer login decoy at /adminer.php', async () => {
    const response = await SELF.fetch('http://example.test/adminer.php');
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('Login - Adminer');
    expect(html).toContain('auth[password]');
  });

  it('serves the phpMyAdmin login decoy for the /PMA/ alias', async () => {
    const response = await SELF.fetch('http://example.test/PMA/');
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('phpMyAdmin');
  });

  it('serves the GitLab CI decoy at /.gitlab-ci.yml', async () => {
    const response = await SELF.fetch('http://example.test/.gitlab-ci.yml');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('yaml');
    expect(await response.text()).toContain('stages:');
  });

  it('mirrors the WP admin-ajax no-action `0` response', async () => {
    const response = await SELF.fetch('http://example.test/wp-admin/admin-ajax.php');
    expect(response.status).toBe(400);
    expect(await response.text()).toBe('0');
  });

  it('serves the phpMyAdmin login decoy for the /pma/index.php login script', async () => {
    const response = await SELF.fetch('http://example.test/pma/index.php');
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('phpMyAdmin');
  });

  it('serves the SVN entries decoy and 404s wc.db (coherent format-10 working copy)', async () => {
    const entries = await SELF.fetch('http://example.test/.svn/entries');
    expect(entries.status).toBe(200);
    expect(await entries.text()).toContain('svn.internal.invalid');

    const wcdb = await SELF.fetch('http://example.test/.svn/wc.db');
    expect(wcdb.status).toBe(404);
  });

  it('serves the JSON runtime-config decoy for a config.<env>.json probe', async () => {
    const response = await SELF.fetch('http://example.test/config.production.json');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const json = (await response.json()) as { apiBaseUrl: string };
    expect(json.apiBaseUrl).toBeTruthy();
  });

  it('serves a fake /etc/passwd for the Nextcloud AppAPI traversal LFI', async () => {
    const response = await SELF.fetch(
      'http://example.test/index.php/apps/app_api/proxy/flow/api/w/nextcloud/jobs_u/get_log_file/..%25252f..%25252fetc%25252fpasswd',
    );
    expect(response.status).toBe(200);
    expect(await response.text()).toMatch(/^root:x:0:0:/);
  });

  it('serves the git config decoy for a subdirectory .git/config probe', async () => {
    const response = await SELF.fetch('http://example.test/api/.git/config');
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('[core]');
  });

  it('serves the WP debug-log decoy at wp-content/debug.log', async () => {
    const response = await SELF.fetch('http://example.test/wp-content/debug.log');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    expect(await response.text()).toContain('/var/www/html/wp-');
  });

  it('serves the Terraform tfvars decoy at /terraform.tfvars', async () => {
    const response = await SELF.fetch('http://example.test/terraform.tfvars');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    expect(await response.text()).toContain('db_password');
  });

  it('serves the Serverless Framework decoy at /serverless.yml', async () => {
    const response = await SELF.fetch('http://example.test/serverless.yml');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('yaml');
    expect(await response.text()).toMatch(/^provider:/m);
  });

  it('serves the Actions workflow decoy at /.github/workflows/deploy.yml', async () => {
    const response = await SELF.fetch('http://example.test/.github/workflows/deploy.yml');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('yaml');
    expect(await response.text()).toMatch(/^jobs:$/m);
  });

  it('serves the GCP key decoy for the camelCase serviceAccountKey.json spelling', async () => {
    const response = await SELF.fetch('http://example.test/serviceAccountKey.json');
    expect(response.status).toBe(200);
    const json = (await response.json()) as { type: string };
    expect(json.type).toBe('service_account');
  });

  it('serves the Django settings decoy at /local_settings.py', async () => {
    const response = await SELF.fetch('http://example.test/local_settings.py');
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('SECRET_KEY');
  });

  it('serves the runtime JSON-config decoy at /env.json', async () => {
    const response = await SELF.fetch('http://example.test/env.json');
    expect(response.status).toBe(200);
    const json = (await response.json()) as { apiBaseUrl: string };
    expect(json.apiBaseUrl).toBeTruthy();
  });

  it('serves the OpenAPI spec decoy at /openapi.json', async () => {
    const response = await SELF.fetch('http://example.test/openapi.json');
    expect(response.status).toBe(200);
    const json = (await response.json()) as { openapi: string };
    expect(json.openapi).toBe('3.0.3');
  });

  it('serves the Go expvar decoy at /debug/vars', async () => {
    const response = await SELF.fetch('http://example.test/debug/vars');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const json = (await response.json()) as {
      cmdline: string[];
      memstats: { NumGC: number; BySize: unknown[] };
    };
    expect(json.cmdline.length).toBeGreaterThan(0);
    expect(json.memstats.NumGC).toBeGreaterThan(0);
    expect(json.memstats.BySize.length).toBeGreaterThan(0);
  });

  it('serves the mysqldump decoy for a served .sql dump', async () => {
    for (const path of ['/database.sql', '/backup/dump.sql', '/wp-content/mysql.sql']) {
      const response = await SELF.fetch(`http://example.test${path}`);
      expect(response.status, path).toBe(200);
      const text = await response.text();
      expect(text, path).toContain('-- MySQL dump');
      expect(text, path).toContain('INSERT INTO `wp_users` VALUES');
    }
  });

  it('404s a compressed dump rather than serving an archive', async () => {
    // Policy §A.4 — the archive pattern is ordered ahead of the .sql one so
    // `backup.sql.gz` takes the Tier 3 404 instead of the SQL body.
    for (const path of ['/backup.sql.gz', '/public_html.tar.gz', '/site.zip']) {
      const response = await SELF.fetch(`http://example.test${path}`);
      expect(response.status, path).toBe(404);
      expect(await response.text(), path).toBe('Not Found');
    }
  });

  it('serves each CI product its own pipeline schema end to end', async () => {
    const cases: Array<[string, RegExp]> = [
      ['/.travis.yml', /^language: node_js$/m],
      ['/.circleci/config.yml', /^version: 2\.1$/m],
      ['/.drone.yml', /^kind: pipeline$/m],
      ['/bitbucket-pipelines.yml', /^pipelines:$/m],
      ['/.buildkite/pipeline.yml', /docker-login#v/],
      ['/azure-pipelines.yml', /^ {2}vmImage: ubuntu-latest$/m],
    ];
    for (const [path, marker] of cases) {
      const response = await SELF.fetch(`http://example.test${path}`);
      expect(response.status, path).toBe(200);
      expect(await response.text(), path).toMatch(marker);
    }
  });

  it('serves the repo build artifacts scanners sweep alongside the CI configs', async () => {
    const cases: Array<[string, string]> = [
      ['/Jenkinsfile', 'pipeline {'],
      ['/Dockerfile', 'FROM node:'],
      ['/Makefile', '.DEFAULT_GOAL := help'],
      ['/Procfile', 'web: gunicorn'],
      ['/app.yaml', 'env_variables:'],
      ['/deploy.sh', '#!/usr/bin/env bash'],
    ];
    for (const [path, marker] of cases) {
      const response = await SELF.fetch(`http://example.test${path}`);
      expect(response.status, path).toBe(200);
      expect(await response.text(), path).toContain(marker);
    }
  });

  it('serves the home-directory dotfile decoys', async () => {
    const cases: Array<[string, string]> = [
      ['/.envrc', 'layout node'],
      ['/.bashrc', 'HISTCONTROL='],
      ['/.bash_history', 'mysqldump'],
      ['/env.example', 'DB_PASSWORD='],
    ];
    for (const [path, marker] of cases) {
      const response = await SELF.fetch(`http://example.test${path}`);
      expect(response.status, path).toBe(200);
      expect(await response.text(), path).toContain(marker);
    }
  });
});
