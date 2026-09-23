import { describe, expect, it } from 'vitest';
import { phpmyadminConfigInc } from '../../../src/bait/templates/phpmyadmin-config-inc.js';

const ctx = (path: string) => ({
  request: new Request(`http://example.test${path}`),
  path,
  category: 'config-leak' as const,
  subcategory: 'phpmyadmin-config',
});

describe('phpmyadmin-config-inc', () => {
  it('returns phpMyAdmin config.inc.php source with the canonical $cfg keys', async () => {
    const response = phpmyadminConfigInc(ctx('/phpmyadmin/config.inc.php'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/x-php');
    const text = await response.text();
    expect(text.startsWith('<?php')).toBe(true);
    expect(text).toContain("$cfg['blowfish_secret']");
    expect(text).toContain("$cfg['Servers'][$i]['host']");
    expect(text).toContain("$cfg['Servers'][$i]['controlpass']");
  });

  it('carries only placeholder secrets and .invalid hosts', async () => {
    const text = await phpmyadminConfigInc(ctx('/pma/config.inc.php')).text();
    expect(text).toContain("'REDACTED_FOR_HONEYPOT'");
    for (const [, host] of text.matchAll(/'host'\] = '([^']+)'/g)) {
      expect(host).toMatch(/\.invalid$/);
    }
  });

  it('emits no canary / tracking headers', () => {
    const response = phpmyadminConfigInc(ctx('/pma/config.inc.php'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
