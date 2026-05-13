import { describe, expect, it } from 'vitest';
import { solrAdminCores } from '../../../src/bait/templates/solr-admin-cores.js';

const ctx = {
  request: new Request('http://example.test/solr/admin/cores'),
  path: '/solr/admin/cores',
  category: 'cve-recon' as const,
  subcategory: 'solr',
};

describe('solr-admin-cores', () => {
  it('returns a Solr-style response with an empty core list', async () => {
    const response = solrAdminCores(ctx);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const json = (await response.json()) as {
      responseHeader: { status: number };
      status: Record<string, unknown>;
    };
    expect(json.responseHeader.status).toBe(0);
    expect(json.status).toEqual({});
  });
});
