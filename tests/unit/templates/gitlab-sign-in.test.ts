import { describe, expect, it } from 'vitest';
import { gitlabSignIn } from '../../../src/bait/templates/gitlab-sign-in.js';

const ctx = (method: string) => ({
  request: new Request('http://example.test/-/users/sign_in', { method }),
  path: '/-/users/sign_in',
  category: 'cve-recon' as const,
  subcategory: 'gitlab',
});

describe('gitlab-sign-in', () => {
  it('renders the standard sign-in form on GET', async () => {
    const response = gitlabSignIn(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    const html = await response.text();
    expect(html).toContain('<form action="/users/sign_in"');
    expect(html).toContain('name="user[login]"');
    expect(html).toContain('name="user[password]"');
    expect(html).toContain('authenticity_token');
    expect(html).not.toContain('Invalid login or password');
  });

  it('shows the flash error on POST', async () => {
    const response = gitlabSignIn(ctx('POST'));
    const html = await response.text();
    expect(html).toContain('Invalid login or password');
  });
});
