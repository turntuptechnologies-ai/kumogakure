import { describe, expect, it } from 'vitest';
import { awsMetadataRole } from '../../../src/bait/templates/aws-metadata-role.js';

const ctx = {
  request: new Request('http://example.test/latest/meta-data/iam/security-credentials/'),
  path: '/latest/meta-data/iam/security-credentials/',
  category: 'ssrf-bait' as const,
  subcategory: 'aws',
};

describe('aws-metadata-role', () => {
  it('returns a single fake role name as plain text', async () => {
    const response = awsMetadataRole(ctx);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    const body = await response.text();
    expect(body.trim()).toBe('example-fake-role');
  });
});
