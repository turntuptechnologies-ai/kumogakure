import { describe, expect, it } from 'vitest';
import { fakeAwsCredentials } from '../../../src/bait/templates/fake-aws-credentials.js';

const ctx = (method: string) => ({
  request: new Request('http://example.test/.aws/credentials', { method }),
  path: '/.aws/credentials',
  category: 'config-leak' as const,
  subcategory: 'aws',
});

describe('fake-aws-credentials', () => {
  it('returns an INI-formatted credentials file with non-functional secrets', async () => {
    const response = fakeAwsCredentials(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    const body = await response.text();
    expect(body).toContain('[default]');
    expect(body).toContain('aws_access_key_id = EXAMPLE_AKIA');
    expect(body).toContain('aws_secret_access_key = REDACTED_FOR_HONEYPOT');
  });
});
