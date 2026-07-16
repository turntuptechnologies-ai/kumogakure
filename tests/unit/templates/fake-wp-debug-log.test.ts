import { describe, expect, it } from 'vitest';
import { fakeWpDebugLog } from '../../../src/bait/templates/fake-wp-debug-log.js';

const ctx = () => ({
  request: new Request('http://example.test/wp-content/debug.log'),
  path: '/wp-content/debug.log',
  category: 'config-leak' as const,
  subcategory: 'wordpress',
});

describe('fake-wp-debug-log', () => {
  it('serves a plausible WP debug log as plain text', async () => {
    const response = fakeWpDebugLog(ctx());
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    const text = await response.text();
    // timestamped PHP log lines that disclose the web root
    expect(text).toMatch(/^\[\d{2}-[A-Za-z]{3}-\d{4} [\d:]+ UTC] PHP /m);
    expect(text).toContain('/var/www/html/wp-');
  });

  it('leaks no credential material', async () => {
    const text = await fakeWpDebugLog(ctx()).text();
    expect(text).not.toMatch(/password|secret|api[_-]?key|token/i);
  });

  it('emits no canary / tracking headers', () => {
    const response = fakeWpDebugLog(ctx());
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
