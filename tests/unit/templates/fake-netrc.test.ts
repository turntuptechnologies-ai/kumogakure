import { describe, expect, it } from 'vitest';
import { fakeNetrc } from '../../../src/bait/templates/fake-netrc.js';

const ctx = {
  request: new Request('http://example.test/root/.netrc', { method: 'GET' }),
  path: '/root/.netrc',
  category: 'config-leak' as const,
  subcategory: 'netrc',
};

describe('fake-netrc template', () => {
  it('serves a 200 plaintext netrc', async () => {
    const res = fakeNetrc(ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/plain');
    const body = await res.text();
    expect(body).toContain('machine github.invalid');
    expect(body).toContain('default login anonymous');
  });

  it('every machine line carries only a placeholder password', async () => {
    const body = await fakeNetrc(ctx).text();
    const machineLines = body.split('\n').filter((l) => l.startsWith('machine '));
    expect(machineLines.length).toBeGreaterThan(0);
    for (const line of machineLines) {
      expect(line).toMatch(/ password REDACTED_FOR_HONEYPOT$/);
    }
  });

  it('emits no honeypot canary header', () => {
    for (const [k] of fakeNetrc(ctx).headers.entries()) {
      expect(k.toLowerCase()).not.toContain('honeypot');
    }
  });
});
