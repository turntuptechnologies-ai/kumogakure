import { describe, expect, it } from 'vitest';
import { swaggerFake } from '../../../src/bait/templates/swagger-fake.js';

const ctx = {
  request: new Request('http://example.test/swagger.json'),
  path: '/swagger.json',
  category: 'api-recon' as const,
  subcategory: 'openapi',
};

interface OpenApiDoc {
  openapi: string;
  info: { title: string; version: string };
  servers: Array<{ url: string }>;
  paths: Record<string, unknown>;
}

describe('swagger-fake', () => {
  it('returns a minimal OpenAPI 3 document', async () => {
    const response = swaggerFake(ctx);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const doc = (await response.json()) as OpenApiDoc;
    expect(doc.openapi.startsWith('3.')).toBe(true);
    expect(doc.info.title).toBeTruthy();
    expect(doc.servers[0]?.url).toContain('example.invalid');
    expect(doc.paths).toHaveProperty('/users');
    expect(doc.paths).toHaveProperty('/auth/login');
  });
});
