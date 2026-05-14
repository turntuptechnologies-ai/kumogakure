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
});
