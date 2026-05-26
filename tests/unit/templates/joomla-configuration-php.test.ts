import { describe, expect, it } from 'vitest';
import { joomlaConfigurationPhp } from '../../../src/bait/templates/joomla-configuration-php.js';

const ctx = (method: string) => ({
  request: new Request('http://example.test/configuration.php', { method }),
  path: '/configuration.php',
  category: 'config-leak' as const,
  subcategory: 'joomla-config',
});

describe('joomla-configuration-php', () => {
  it('returns a Joomla configuration.php with class JConfig', async () => {
    const response = joomlaConfigurationPhp(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/x-php');
    const body = await response.text();
    expect(body).toContain('<?php');
    expect(body).toContain('class JConfig');
    expect(body).toContain('public $host');
    expect(body).toContain('public $password');
    expect(body).toContain('public $secret');
    expect(body).toContain('public $smtppass');
  });

  it('uses .invalid host and REDACTED placeholder for secrets', async () => {
    const response = joomlaConfigurationPhp(ctx('GET'));
    const body = await response.text();
    expect(body).toContain('db.example.invalid');
    expect(body).toContain('smtp.example.invalid');
    expect(body).toContain('REDACTED_FOR_HONEYPOT');
  });

  it('emits no canary / tracking headers', () => {
    const response = joomlaConfigurationPhp(ctx('GET'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
