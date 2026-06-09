import { describe, expect, it } from 'vitest';
import { nextjsServerAction } from '../../../src/bait/templates/nextjs-server-action.js';

const ctx = () => ({
  request: new Request('http://example.test/', { method: 'POST' }),
  path: '/',
  category: 'cve-recon' as const,
  subcategory: 'nextjs-server-action',
});

describe('nextjs-server-action', () => {
  it('returns an RSC flight response (text/x-component)', async () => {
    const response = nextjsServerAction(ctx());
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/x-component');
    const body = await response.text();
    // flight stream is newline-delimited `<id>:<payload>` rows
    expect(body).toMatch(/^0:\{/);
    expect(body).toContain('1:');
  });

  it('emits the RSC/action Vary header Next.js sends', () => {
    const vary = nextjsServerAction(ctx()).headers.get('vary') ?? '';
    expect(vary).toContain('RSC');
    expect(vary).toContain('Next-Action');
  });

  it('emits no canary / tracking headers', () => {
    const response = nextjsServerAction(ctx());
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
