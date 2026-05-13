import { describe, expect, it } from 'vitest';
import { graphqlIntrospection } from '../../../src/bait/templates/graphql-introspection.js';

const ctx = {
  request: new Request('http://example.test/graphql', { method: 'POST' }),
  path: '/graphql',
  category: 'api-recon' as const,
  subcategory: 'graphql',
};

interface IntrospectionResult {
  data: {
    __schema: {
      queryType: { name: string };
      types: Array<{ name: string; fields?: Array<{ name: string }> }>;
    };
  };
}

describe('graphql-introspection', () => {
  it('returns a minimal introspection payload', async () => {
    const response = graphqlIntrospection(ctx);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const payload = (await response.json()) as IntrospectionResult;
    expect(payload.data.__schema.queryType.name).toBe('Query');
    const typeNames = payload.data.__schema.types.map((t) => t.name);
    expect(typeNames).toContain('Query');
    expect(typeNames).toContain('User');
  });
});
