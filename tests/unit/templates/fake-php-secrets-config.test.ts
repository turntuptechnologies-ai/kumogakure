import { describe, expect, it } from 'vitest';
import { fakePhpSecretsConfig } from '../../../src/bait/templates/fake-php-secrets-config.js';

const ctx = (path: string) => ({
  request: new Request(`http://example.test${path}`, { method: 'GET' }),
  path,
  category: 'config-leak' as const,
  subcategory: 'php-config-directory',
});

describe('fake-php-secrets-config', () => {
  it('returns a PHP array with secret-shaped keys', async () => {
    const response = fakePhpSecretsConfig(ctx('/config.php'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/x-php');
    const body = await response.text();
    expect(body).toContain('<?php');
    expect(body).toContain('return [');
    expect(body).toContain("'secret' => 'REDACTED_FOR_HONEYPOT'");
    expect(body).toContain("'password' => 'REDACTED_FOR_HONEYPOT'");
  });

  it('emits no canary / tracking headers', () => {
    const response = fakePhpSecretsConfig(ctx('/config/mail.php'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
