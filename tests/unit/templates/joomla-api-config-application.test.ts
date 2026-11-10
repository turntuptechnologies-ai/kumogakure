import { describe, expect, it } from 'vitest';
import { joomlaApiConfigApplication } from '../../../src/bait/templates/joomla-api-config-application.js';

const ctx = {
  request: new Request('https://example.test/api/index.php/v1/config/application?public=true&x=1'),
  path: '/api/index.php/v1/config/application',
  category: 'cve-recon' as const,
  subcategory: 'joomla-cve-2023-23752',
};

interface JsonApi {
  links: { self: string };
  data: { type: string; id: string; attributes: Record<string, unknown> }[];
}

describe('joomla-api-config-application', () => {
  it('returns the CVE-2023-23752 JSON:API config dump', async () => {
    const response = joomlaApiConfigApplication(ctx);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/vnd.api+json');
    const json = (await response.json()) as JsonApi;
    for (const item of json.data) {
      expect(item.type).toBe('application');
      expect(item.id).toBe('224');
      expect(item.attributes.id).toBe(224);
    }
  });

  it('leaks the same fabricated DB settings as the configuration.php decoy', async () => {
    const json = (await joomlaApiConfigApplication(ctx).json()) as JsonApi;
    const settings = Object.assign({}, ...json.data.map((d) => d.attributes));
    expect(settings).toMatchObject({
      host: 'db.example.invalid',
      user: 'app_user',
      password: 'REDACTED_FOR_HONEYPOT',
      db: 'example_joomla',
      dbprefix: 'jos_',
    });
  });

  it('builds links from the request origin with a fixed query', async () => {
    const json = (await joomlaApiConfigApplication(ctx).json()) as JsonApi;
    expect(json.links.self).toBe(
      'https://example.test/api/index.php/v1/config/application?public=true',
    );
  });
});
