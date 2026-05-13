import { describe, expect, it } from 'vitest';
import { fakeGitConfig } from '../../../src/bait/templates/fake-git-config.js';

const ctx = (method: string) => ({
  request: new Request('http://example.test/.git/config', { method }),
  path: '/.git/config',
  category: 'config-leak' as const,
  subcategory: 'git',
});

describe('fake-git-config', () => {
  it('returns a valid-looking git config', async () => {
    const response = fakeGitConfig(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    const body = await response.text();
    expect(body).toContain('[core]');
    expect(body).toContain('[remote "origin"]');
    expect(body).toContain('example.invalid');
  });
});
