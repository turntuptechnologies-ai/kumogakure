import { describe, expect, it } from 'vitest';
import { wordpressRestRoot } from '../../../src/bait/templates/wordpress-rest-root.js';

const ctx = (path: string) => ({
  request: new Request(`http://example.test${path}`),
  path,
  category: 'cms-auth' as const,
  subcategory: 'wordpress-fingerprint',
});

describe('wordpress-rest-root', () => {
  it('returns the WordPress REST index shape with namespaces', async () => {
    const response = wordpressRestRoot(ctx('/wp-json/'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const index = JSON.parse(await response.text()) as {
      namespaces: string[];
      routes: Record<string, unknown>;
      authentication: unknown;
    };
    expect(index.namespaces).toContain('wp/v2');
    expect(index.routes).toHaveProperty('/wp/v2/users');
    expect(index).toHaveProperty('authentication');
  });

  it('sets the api.w.org Link header WordPress emits on the index', () => {
    const response = wordpressRestRoot(ctx('/wp-json'));
    expect(response.headers.get('link')).toContain('api.w.org');
  });
});
