import { describe, expect, it } from 'vitest';
import { rankmathGethead } from '../../../src/bait/templates/rankmath-gethead.js';

const ctx = (path: string) => ({
  request: new Request(`http://example.test${path}`),
  path,
  category: 'cve-recon' as const,
  subcategory: 'rankmath',
});

describe('rankmath-gethead', () => {
  it('mirrors the url-absent 400 rest_missing_callback_param body', async () => {
    const response = rankmathGethead(ctx('/wp-json/rankmath/v1/getHead'));
    expect(response.status).toBe(400);
    expect(response.headers.get('content-type')).toContain('application/json');
    const json = (await response.json()) as {
      code: string;
      data: { status: number; params: string[] };
    };
    expect(json.code).toBe('rest_missing_callback_param');
    expect(json.data.status).toBe(400);
    expect(json.data.params).toContain('url');
  });

  it('does not reflect the probed url back (no SSRF performed)', async () => {
    const path = '/wp-json/rankmath/v1/getHead';
    const response = rankmathGethead({
      request: new Request(`http://example.test${path}?url=http://169.254.169.254/`),
      path,
      category: 'cve-recon',
      subcategory: 'rankmath',
    });
    const text = await response.text();
    expect(text).not.toContain('169.254.169.254');
  });

  it('emits no canary / tracking headers', () => {
    const response = rankmathGethead(ctx('/wp-json/rankmath/v1/getHead'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
