import { describe, expect, it } from 'vitest';
import { yii2Debug } from '../../../src/bait/templates/yii2-debug.js';

const ctx = (method: string) => ({
  request: new Request('http://example.test/debug/default/view', { method }),
  path: '/debug/default/view',
  category: 'cve-recon' as const,
  subcategory: 'yii2-debug',
});

describe('yii2-debug', () => {
  it('returns an HTML page that resembles the Yii Debug Toolbar viewer', async () => {
    const response = yii2Debug(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    const body = await response.text();
    expect(body).toContain('Yii Debugger');
    expect(body).toContain('Available Debug Data');
    expect(body).toMatch(/Yii Version:.*<b>\d+\.\d+\.\d+/);
  });

  it('emits no canary / tracking headers', () => {
    const response = yii2Debug(ctx('GET'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
