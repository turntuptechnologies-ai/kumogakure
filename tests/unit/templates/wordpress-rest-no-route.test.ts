import { describe, expect, it } from 'vitest';
import { wordpressRestNoRoute } from '../../../src/bait/templates/wordpress-rest-no-route.js';

const ctx = {
  request: new Request('http://example.test/wp-json/kirki/v1/forgot-password'),
  path: '/wp-json/kirki/v1/forgot-password',
  category: 'unknown' as const,
  subcategory: 'wordpress-rest',
};

describe('wordpress-rest-no-route', () => {
  it("returns WordPress's rest_no_route JSON 404", async () => {
    const response = wordpressRestNoRoute(ctx);
    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await response.json()).toEqual({
      code: 'rest_no_route',
      message: 'No route was found matching the URL and request method.',
      data: { status: 404 },
    });
  });
});
