import { describe, expect, it } from 'vitest';
import { wordpressBatch } from '../../../src/bait/templates/wordpress-batch.js';

function ctx(init: {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: string;
}) {
  const url = init.url ?? 'http://example.test/wp-json/batch/v1';
  return {
    request: new Request(url, { method: init.method ?? 'POST', headers: init.headers }),
    path: new URL(url).pathname,
    category: 'cve-recon' as const,
    subcategory: 'wp2shell',
    body: init.body,
  };
}

interface Batch {
  responses: { body: { code: string; data: { status: number } }; status: number }[];
}

describe('wordpress-batch', () => {
  it('returns rest_no_route for a plain GET (only POST is registered)', async () => {
    const response = wordpressBatch(ctx({ method: 'GET' }));
    expect(response.status).toBe(404);
    expect(((await response.json()) as { code: string }).code).toBe('rest_no_route');
  });

  it('requires the requests parameter', async () => {
    const response = wordpressBatch(ctx({ body: '' }));
    expect(response.status).toBe(400);
    const json = (await response.json()) as { code: string; data: { params: string[] } };
    expect(json.code).toBe('rest_missing_callback_param');
    expect(json.data.params).toEqual(['requests']);
  });

  it('answers a batch with 207 and one unauthenticated refusal per sub-request', async () => {
    const body = JSON.stringify({
      requests: [
        { method: 'POST', path: '/wp/v2/posts', body: { title: 'x' } },
        { method: 'POST', path: '/some-plugin/v1/thing' },
      ],
    });
    const response = wordpressBatch(ctx({ body }));
    expect(response.status).toBe(207);
    const json = (await response.json()) as Batch;
    expect(json.responses.map((r) => r.status)).toEqual([401, 404]);
    expect(json.responses.map((r) => r.body.code)).toEqual(['rest_forbidden', 'rest_no_route']);
  });

  it('does not reflect request content', async () => {
    const body = JSON.stringify({ requests: [{ method: 'POST', path: '/wp/v2/posts?x=MARKER' }] });
    const text = await wordpressBatch(ctx({ body })).text();
    expect(text).not.toContain('MARKER');
  });

  it("caps the batch at WordPress's 25-request limit", async () => {
    const body = JSON.stringify({ requests: Array.from({ length: 40 }, () => ({ path: '/x' })) });
    const json = (await wordpressBatch(ctx({ body })).json()) as Batch;
    expect(json.responses).toHaveLength(25);
  });

  it('honours _method and X-HTTP-Method-Override like WordPress', () => {
    const body = JSON.stringify({ requests: [] });
    const viaQuery = wordpressBatch(
      ctx({ method: 'GET', url: 'http://example.test/wp-json/batch/v1?_method=POST', body }),
    );
    expect(viaQuery.status).toBe(207);
    const viaHeader = wordpressBatch(
      ctx({ method: 'GET', headers: { 'X-HTTP-Method-Override': 'POST' }, body }),
    );
    expect(viaHeader.status).toBe(207);
  });
});
