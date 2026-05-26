import { describe, expect, it } from 'vitest';
import { drupalSettingsPhp } from '../../../src/bait/templates/drupal-settings-php.js';

const ctx = (method: string) => ({
  request: new Request('http://example.test/settings.php', { method }),
  path: '/settings.php',
  category: 'config-leak' as const,
  subcategory: 'drupal-config',
});

describe('drupal-settings-php', () => {
  it('returns a Drupal settings.php with $databases + hash_salt', async () => {
    const response = drupalSettingsPhp(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/x-php');
    const body = await response.text();
    expect(body).toContain('<?php');
    expect(body).toContain("$databases['default']['default']");
    expect(body).toContain("'driver' => 'mysql'");
    expect(body).toContain("$settings['hash_salt']");
    expect(body).toContain('trusted_host_patterns');
  });

  it('uses .invalid host and REDACTED placeholder for secrets', async () => {
    const response = drupalSettingsPhp(ctx('GET'));
    const body = await response.text();
    expect(body).toContain('db.example.invalid');
    expect(body).toContain('REDACTED_FOR_HONEYPOT');
  });

  it('emits no canary / tracking headers', () => {
    const response = drupalSettingsPhp(ctx('GET'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
