import { describe, expect, it } from 'vitest';
import { forbidden } from '../../../src/bait/templates/forbidden.js';

const ctx = {
  request: new Request('http://example.test/wp-includes/js/'),
  path: '/wp-includes/js/',
  category: 'cms-auth' as const,
  subcategory: 'wordpress-fingerprint',
};

describe('forbidden', () => {
  it('returns a status-only 403', async () => {
    const response = forbidden(ctx);
    expect(response.status).toBe(403);
    expect(response.headers.get('content-type')).toContain('text/plain');
    expect(await response.text()).toBe('Forbidden');
  });
});
