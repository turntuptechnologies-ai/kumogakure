import { describe, expect, it } from 'vitest';
import { fakeFtpConfig } from '../../../src/bait/templates/fake-ftp-config.js';

const ctx = (path: string) => ({
  request: new Request(`http://example.test${path}`),
  path,
  category: 'config-leak' as const,
  subcategory: 'ftp-credentials',
});

describe('fake-ftp-config', () => {
  it('returns fake SFTP credentials with secrets redacted (JSON default)', async () => {
    const response = fakeFtpConfig(ctx('/sftp.json'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const cfg = JSON.parse(await response.text()) as { host: string; password: string };
    expect(cfg.host).toContain('.invalid');
    expect(cfg.password).toBe('REDACTED_FOR_HONEYPOT');
  });

  it('renders the format the requested extension implies', async () => {
    expect(fakeFtpConfig(ctx('/ftp.yml')).headers.get('content-type')).toContain('yaml');
    expect(fakeFtpConfig(ctx('/ftp.xml')).headers.get('content-type')).toContain('xml');
    expect(fakeFtpConfig(ctx('/ftp.ini')).headers.get('content-type')).toContain('text/plain');
    expect(fakeFtpConfig(ctx('/ftp.config.js')).headers.get('content-type')).toContain(
      'javascript',
    );

    const yaml = await fakeFtpConfig(ctx('/sftp.yaml')).text();
    expect(yaml).toContain('host: deploy.example.invalid');
    const xml = await fakeFtpConfig(ctx('/sftp.xml')).text();
    expect(xml).toContain('<host>deploy.example.invalid</host>');
    const js = await fakeFtpConfig(ctx('/sftp.config.js')).text();
    expect(js).toContain('module.exports');
  });

  it('serves JSON for bare/dotfile/template forms (no extension match)', () => {
    for (const p of ['/ftpconfig', '/.sftprc', '/sftp.json.dist']) {
      expect(fakeFtpConfig(ctx(p)).headers.get('content-type')).toContain('application/json');
    }
  });

  it('emits no canary / tracking headers', () => {
    const response = fakeFtpConfig(ctx('/sftp.json'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
