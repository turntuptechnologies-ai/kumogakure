import { describe, expect, it } from 'vitest';
import { fakeBoto } from '../../../src/bait/templates/fake-boto.js';

const ctx = {
  request: new Request('http://example.test/.boto', { method: 'GET' }),
  path: '/.boto',
  category: 'config-leak' as const,
  subcategory: 'cloud-credentials',
};

describe('fake-boto template', () => {
  it('serves a 200 plaintext boto config with placeholder secrets', async () => {
    const res = fakeBoto(ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/plain');
    const body = await res.text();
    expect(body).toContain('[Credentials]');
    expect(body).toContain('aws_access_key_id = EXAMPLE_AKIA1234567890ABCDEF');
    expect(body).toContain('aws_secret_access_key = REDACTED_FOR_HONEYPOT');
  });

  it('emits no honeypot canary header', () => {
    for (const [k] of fakeBoto(ctx).headers.entries()) {
      expect(k.toLowerCase()).not.toContain('honeypot');
    }
  });
});
