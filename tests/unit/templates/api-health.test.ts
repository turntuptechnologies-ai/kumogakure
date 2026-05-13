import { describe, expect, it } from 'vitest';
import { apiHealth } from '../../../src/bait/templates/api-health.js';

const ctx = {
  request: new Request('http://example.test/api/v1/health'),
  path: '/api/v1/health',
  category: 'api-recon' as const,
  subcategory: 'generic',
};

describe('api-health', () => {
  it('returns a generic ok JSON status', async () => {
    const response = apiHealth(ctx);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const json = (await response.json()) as { status: string };
    expect(json.status).toBe('ok');
  });
});
