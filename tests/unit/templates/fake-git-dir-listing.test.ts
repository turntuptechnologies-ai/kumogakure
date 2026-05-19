import { describe, expect, it } from 'vitest';
import { fakeGitDirListing } from '../../../src/bait/templates/fake-git-dir-listing.js';

const ctx = {
  request: new Request('http://example.test/.git/', { method: 'GET' }),
  path: '/.git/',
  category: 'config-leak' as const,
  subcategory: 'git',
};

describe('fake-git-dir-listing template', () => {
  it('serves a 200 HTML autoindex of a .git directory', async () => {
    const res = fakeGitDirListing(ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    const body = await res.text();
    expect(body).toContain('Index of /.git');
    // Leads the attacker to the existing fake config/HEAD decoys.
    expect(body).toContain('href="config"');
    expect(body).toContain('href="HEAD"');
  });

  it('emits no honeypot canary header', () => {
    for (const [k] of fakeGitDirListing(ctx).headers.entries()) {
      expect(k.toLowerCase()).not.toContain('honeypot');
    }
  });
});
