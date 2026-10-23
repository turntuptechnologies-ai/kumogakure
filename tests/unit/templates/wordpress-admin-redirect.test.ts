import { describe, expect, it } from 'vitest';
import { wordpressAdminRedirect } from '../../../src/bait/templates/wordpress-admin-redirect.js';

function ctx(url: string) {
  return {
    request: new Request(url),
    path: new URL(url).pathname,
    category: 'cms-auth' as const,
    subcategory: 'wordpress-fingerprint',
  };
}

describe('wordpress-admin-redirect', () => {
  it('redirects to wp-login.php with redirect_to and reauth=1, like auth_redirect()', () => {
    const response = wordpressAdminRedirect(ctx('https://example.test/wp-admin/network/'));
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(
      'https://example.test/wp-login.php?redirect_to=https%3A%2F%2Fexample.test%2Fwp-admin%2Fnetwork%2F&reauth=1',
    );
  });

  it('stays on the host the request came in on', () => {
    const response = wordpressAdminRedirect(ctx('http://other.test/wp-admin/'));
    const location = new URL(response.headers.get('location') ?? '');
    expect(location.origin).toBe('http://other.test');
    expect(location.pathname).toBe('/wp-login.php');
    expect(location.searchParams.get('redirect_to')).toBe('http://other.test/wp-admin/');
  });
});
