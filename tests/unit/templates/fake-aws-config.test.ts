import { describe, expect, it } from 'vitest';
import { fakeAwsConfig } from '../../../src/bait/templates/fake-aws-config.js';

const ctx = {
  request: new Request('http://example.test/root/.aws/config', { method: 'GET' }),
  path: '/root/.aws/config',
  category: 'config-leak' as const,
  subcategory: 'aws',
};

describe('fake-aws-config template', () => {
  it('serves a 200 plaintext AWS config', async () => {
    const res = fakeAwsConfig(ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/plain');
    const body = await res.text();
    expect(body).toContain('[default]');
    expect(body).toContain('region = us-east-1');
    expect(body).toContain('role_arn = arn:aws:iam::123456789012:role/');
  });

  it('contains no secret material', async () => {
    const body = await fakeAwsConfig(ctx).text();
    expect(body).not.toContain('aws_secret_access_key');
    expect(body).not.toContain('AKIA');
  });

  it('emits no honeypot canary header', () => {
    for (const [k] of fakeAwsConfig(ctx).headers.entries()) {
      expect(k.toLowerCase()).not.toContain('honeypot');
    }
  });
});
