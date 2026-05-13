import { describe, expect, it } from 'vitest';
import { fakeWpConfig } from '../../../src/bait/templates/fake-wp-config.js';

const ctx = (method: string) => ({
  request: new Request('http://example.test/wp-config.php.bak', { method }),
  path: '/wp-config.php.bak',
  category: 'config-leak' as const,
  subcategory: 'wordpress',
});

describe('fake-wp-config', () => {
  it('returns a PHP-formatted configuration with non-functional secrets', async () => {
    const response = fakeWpConfig(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    const body = await response.text();
    expect(body).toContain('<?php');
    expect(body).toContain("define( 'DB_NAME'");
    expect(body).toContain('REDACTED_FOR_HONEYPOT');
    expect(body).toContain('EXAMPLE_AUTH_KEY_NOT_FUNCTIONAL');
  });
});
