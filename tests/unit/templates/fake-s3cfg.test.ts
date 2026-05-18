import { describe, expect, it } from 'vitest';
import { fakeS3cfg } from '../../../src/bait/templates/fake-s3cfg.js';

const ctx = {
  request: new Request('http://example.test/root/.s3cfg', { method: 'GET' }),
  path: '/root/.s3cfg',
  category: 'config-leak' as const,
  subcategory: 'cloud-credentials',
};

describe('fake-s3cfg template', () => {
  it('serves a 200 plaintext s3cmd config with placeholder secrets', async () => {
    const res = fakeS3cfg(ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/plain');
    const body = await res.text();
    expect(body).toContain('access_key = EXAMPLE_AKIA1234567890ABCDEF');
    expect(body).toContain('secret_key = REDACTED_FOR_HONEYPOT');
  });

  it('emits no honeypot canary header', () => {
    for (const [k] of fakeS3cfg(ctx).headers.entries()) {
      expect(k.toLowerCase()).not.toContain('honeypot');
    }
  });
});
