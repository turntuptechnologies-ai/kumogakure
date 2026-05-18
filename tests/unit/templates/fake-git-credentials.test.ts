import { describe, expect, it } from 'vitest';
import { fakeGitCredentials } from '../../../src/bait/templates/fake-git-credentials.js';

const ctx = {
  request: new Request('http://example.test/root/.git-credentials', { method: 'GET' }),
  path: '/root/.git-credentials',
  category: 'config-leak' as const,
  subcategory: 'git-credentials',
};

describe('fake-git-credentials template', () => {
  it('serves a 200 plaintext credential store', async () => {
    const res = fakeGitCredentials(ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/plain');
  });

  it('is structurally authentic but every secret is non-actionable', async () => {
    const body = await fakeGitCredentials(ctx).text();
    const lines = body.trim().split('\n');
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) {
      // git-credentials store format: https://user:pass@host
      expect(line).toMatch(/^https:\/\/[^:]+:REDACTED_FOR_HONEYPOT@[^/]+\.invalid$/);
    }
  });

  it('emits no honeypot canary header', () => {
    const res = fakeGitCredentials(ctx);
    for (const [k] of res.headers.entries()) {
      expect(k.toLowerCase()).not.toContain('honeypot');
    }
  });
});
