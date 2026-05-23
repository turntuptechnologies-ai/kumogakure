import { describe, expect, it } from 'vitest';
import { fakeVscodeSftp } from '../../../src/bait/templates/fake-vscode-sftp.js';

const ctx = (method: string) => ({
  request: new Request('http://example.test/.vscode/sftp.json', { method }),
  path: '/.vscode/sftp.json',
  category: 'config-leak' as const,
  subcategory: 'editor-credentials',
});

describe('fake-vscode-sftp', () => {
  it('returns a 200 JSON config shaped like the VS Code SFTP extension', async () => {
    const response = fakeVscodeSftp(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const body = await response.text();
    const parsed = JSON.parse(body);
    expect(parsed.protocol).toBe('sftp');
    expect(parsed.host).toContain('.invalid');
    expect(parsed.username).toBeDefined();
    expect(parsed.remotePath).toBeDefined();
  });

  it('uses non-actionable placeholders for password / privateKey / passphrase', async () => {
    const response = fakeVscodeSftp(ctx('GET'));
    const body = await response.text();
    const parsed = JSON.parse(body);
    expect(parsed.password).toBe('REDACTED_FOR_HONEYPOT');
    expect(parsed.privateKeyPath).toBe('REDACTED_FOR_HONEYPOT');
    expect(parsed.passphrase).toBe('REDACTED_FOR_HONEYPOT');
  });

  it('emits no canary / tracking headers', () => {
    const response = fakeVscodeSftp(ctx('GET'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
