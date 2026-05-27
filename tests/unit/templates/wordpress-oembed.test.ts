import { describe, expect, it } from 'vitest';
import { wordpressOembed } from '../../../src/bait/templates/wordpress-oembed.js';

const ctx = (method: string) => ({
  request: new Request('http://example.test/wp-json/oembed/1.0/embed', { method }),
  path: '/wp-json/oembed/1.0/embed',
  category: 'cms-auth' as const,
  subcategory: 'wordpress-fingerprint',
});

describe('wordpress-oembed', () => {
  it('returns the canonical rest_missing_callback_param 400 envelope', async () => {
    const response = wordpressOembed(ctx('GET'));
    expect(response.status).toBe(400);
    expect(response.headers.get('content-type')).toContain('application/json');
    const body = await response.text();
    const parsed = JSON.parse(body);
    expect(parsed.code).toBe('rest_missing_callback_param');
    expect(parsed.message).toContain('url');
    expect(parsed.data.status).toBe(400);
    expect(parsed.data.params).toEqual(['url']);
  });

  it('emits no canary / tracking headers', () => {
    const response = wordpressOembed(ctx('GET'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
