import { describe, expect, it } from 'vitest';
import { phpDatabaseConfig } from '../../../src/bait/templates/php-database-config.js';

const ctx = (method: string, path: string) => ({
  request: new Request(`http://example.test${path}`, { method }),
  path,
  category: 'config-leak' as const,
  subcategory: 'php-db-config',
});

describe('php-database-config', () => {
  it('returns a Laravel-style return [...] array with mysql + pgsql + redis', async () => {
    const response = phpDatabaseConfig(ctx('GET', '/database.php'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/x-php');
    const body = await response.text();
    expect(body).toContain('<?php');
    expect(body).toContain('return [');
    expect(body).toContain("'mysql'");
    expect(body).toContain("'pgsql'");
    expect(body).toContain("'redis'");
    expect(body).toContain("'password' => 'REDACTED_FOR_HONEYPOT'");
  });

  it('serves identical body for /database.php and /db.php', async () => {
    const a = await phpDatabaseConfig(ctx('GET', '/database.php')).text();
    const b = await phpDatabaseConfig(ctx('GET', '/db.php')).text();
    expect(a).toBe(b);
  });

  it('uses .invalid host for every connection', async () => {
    const response = phpDatabaseConfig(ctx('GET', '/database.php'));
    const body = await response.text();
    expect(body).toContain('db.example.invalid');
    expect(body).toContain('redis.example.invalid');
  });

  it('emits no canary / tracking headers', () => {
    const response = phpDatabaseConfig(ctx('GET', '/database.php'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
