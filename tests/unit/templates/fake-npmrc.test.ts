import { describe, expect, it } from 'vitest';
import { fakeNpmrc } from '../../../src/bait/templates/fake-npmrc.js';

const ctx = {
  request: new Request('http://example.test/.npmrc', { method: 'GET' }),
  path: '/.npmrc',
  category: 'config-leak' as const,
  subcategory: 'package-registry-credentials',
};

describe('fake-npmrc template', () => {
  it('serves a 200 plaintext npmrc with a placeholder auth token', async () => {
    const res = fakeNpmrc(ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/plain');
    const body = await res.text();
    expect(body).toContain('//registry.npmjs.org/:_authToken=REDACTED_FOR_HONEYPOT');
    for (const line of body.split('\n').filter((l) => l.includes('_authToken='))) {
      expect(line.endsWith('_authToken=REDACTED_FOR_HONEYPOT')).toBe(true);
    }
  });

  it('emits no honeypot canary header', () => {
    for (const [k] of fakeNpmrc(ctx).headers.entries()) {
      expect(k.toLowerCase()).not.toContain('honeypot');
    }
  });
});
