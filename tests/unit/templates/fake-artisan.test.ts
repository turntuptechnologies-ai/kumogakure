import { describe, expect, it } from 'vitest';
import { fakeArtisan } from '../../../src/bait/templates/fake-artisan.js';

const ctx = (method: string) => ({
  request: new Request('http://example.test/artisan', { method }),
  path: '/artisan',
  category: 'config-leak' as const,
  subcategory: 'laravel-artisan',
});

describe('fake-artisan', () => {
  it('returns the Laravel artisan bootstrap script as PHP source', async () => {
    const response = fakeArtisan(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/x-php');
    const body = await response.text();
    expect(body).toContain('#!/usr/bin/env php');
    expect(body).toContain("require __DIR__.'/vendor/autoload.php';");
    expect(body).toContain("require_once __DIR__.'/bootstrap/app.php'");
    expect(body).toContain('Illuminate\\Contracts\\Console\\Kernel::class');
  });

  it('emits no canary / tracking headers', () => {
    const response = fakeArtisan(ctx('GET'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
