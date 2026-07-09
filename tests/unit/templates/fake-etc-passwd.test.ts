import { describe, expect, it } from 'vitest';
import { fakeEtcPasswd } from '../../../src/bait/templates/fake-etc-passwd.js';

const ctx = () => ({
  request: new Request(
    'http://example.test/apps/app_api/proxy/x/get_log_file/..%252fetc%252fpasswd',
  ),
  path: '/apps/app_api/proxy/x/get_log_file/..%252fetc%252fpasswd',
  category: 'cve-recon' as const,
  subcategory: 'nextcloud',
});

describe('fake-etc-passwd', () => {
  it('returns a plausible /etc/passwd as plain text', async () => {
    const response = fakeEtcPasswd(ctx());
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    const text = await response.text();
    expect(text).toMatch(/^root:x:0:0:/);
    // every line is a valid 7-field passwd entry
    for (const line of text.trimEnd().split('\n')) {
      expect(line.split(':').length, line).toBe(7);
    }
  });

  it('leaks no password material (passwd fields are x, never hashes)', async () => {
    const text = await fakeEtcPasswd(ctx()).text();
    for (const line of text.trimEnd().split('\n')) {
      expect(line.split(':')[1], line).toBe('x');
    }
  });

  it('emits no canary / tracking headers', () => {
    const response = fakeEtcPasswd(ctx());
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
