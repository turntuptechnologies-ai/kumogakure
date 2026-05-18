import { describe, expect, it } from 'vitest';
import { fakeGitconfig } from '../../../src/bait/templates/fake-gitconfig.js';

const ctx = {
  request: new Request('http://example.test/root/.gitconfig', { method: 'GET' }),
  path: '/root/.gitconfig',
  category: 'config-leak' as const,
  subcategory: 'git',
};

describe('fake-gitconfig template', () => {
  it('serves a 200 plaintext global gitconfig', async () => {
    const res = fakeGitconfig(ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/plain');
    const body = await res.text();
    expect(body).toContain('[user]');
    expect(body).toContain('helper = store');
  });

  it('uses only policy-compliant fabricated identity', async () => {
    const body = await fakeGitconfig(ctx).text();
    expect(body).toContain('deploy@example.invalid');
    expect(body).toContain('github.invalid');
  });

  it('emits no honeypot canary header', () => {
    const res = fakeGitconfig(ctx);
    for (const [k] of res.headers.entries()) {
      expect(k.toLowerCase()).not.toContain('honeypot');
    }
  });
});
