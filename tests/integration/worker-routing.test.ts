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
});
