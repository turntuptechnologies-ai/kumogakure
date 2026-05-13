import { describe, expect, it } from 'vitest';
import { gcpMetadataSa } from '../../../src/bait/templates/gcp-metadata-sa.js';

const ctx = {
  request: new Request('http://example.test/computeMetadata/v1/instance/service-accounts/'),
  path: '/computeMetadata/v1/instance/service-accounts/',
  category: 'ssrf-bait' as const,
  subcategory: 'gcp',
};

describe('gcp-metadata-sa', () => {
  it('returns a fake service-account list with the Metadata-Flavor header', async () => {
    const response = gcpMetadataSa(ctx);
    expect(response.status).toBe(200);
    expect(response.headers.get('metadata-flavor')).toBe('Google');
    const body = await response.text();
    expect(body).toContain('default/');
    expect(body).toContain('example-honeypot@example-honeypot.iam.gserviceaccount.com/');
  });
});
