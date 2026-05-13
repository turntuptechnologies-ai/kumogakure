import { describe, expect, it } from 'vitest';
import { fakeGitHead } from '../../../src/bait/templates/fake-git-head.js';

const ctx = (method: string) => ({
  request: new Request('http://example.test/.git/HEAD', { method }),
  path: '/.git/HEAD',
  category: 'config-leak' as const,
  subcategory: 'git',
});

describe('fake-git-head', () => {
  it('returns a ref pointing at main', async () => {
    const response = fakeGitHead(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    const body = await response.text();
    expect(body.trim()).toBe('ref: refs/heads/main');
  });
});
