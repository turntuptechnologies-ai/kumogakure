import { describe, expect, it } from 'vitest';
import { fakePypirc } from '../../../src/bait/templates/fake-pypirc.js';

const ctx = {
  request: new Request('http://example.test/.pypirc', { method: 'GET' }),
  path: '/.pypirc',
  category: 'config-leak' as const,
  subcategory: 'package-registry-credentials',
};

describe('fake-pypirc template', () => {
  it('serves a 200 plaintext pypirc with a placeholder token', async () => {
    const res = fakePypirc(ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/plain');
    const body = await res.text();
    expect(body).toContain('[pypi]');
    expect(body).toContain('username = __token__');
    for (const line of body.split('\n').filter((l) => l.startsWith('password = '))) {
      expect(line).toBe('password = pypi-REDACTED_FOR_HONEYPOT');
    }
  });

  it('emits no honeypot canary header', () => {
    for (const [k] of fakePypirc(ctx).headers.entries()) {
      expect(k.toLowerCase()).not.toContain('honeypot');
    }
  });
});
