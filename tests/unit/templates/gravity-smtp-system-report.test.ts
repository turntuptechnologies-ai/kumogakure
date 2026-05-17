import { describe, expect, it } from 'vitest';
import { gravitySmtpSystemReport } from '../../../src/bait/templates/gravity-smtp-system-report.js';

const BASE = 'http://example.test/wp-json/gravitysmtp/v1/tests/mock-data';

function ctx(query: string) {
  return {
    request: new Request(`${BASE}${query}`, { method: 'GET' }),
    path: '/wp-json/gravitysmtp/v1/tests/mock-data',
    category: 'cve-recon' as const,
    subcategory: 'gravity-smtp',
  };
}

describe('gravity-smtp-system-report template', () => {
  it('returns the fabricated System Report on the exploit query', async () => {
    const res = gravitySmtpSystemReport(ctx('?page=gravitysmtp-settings'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    const j = (await res.json()) as {
      data: { report?: { wordpress: { version: string }; gravity_smtp: object } };
    };
    expect(j.data.report).toBeDefined();
    expect(j.data.report?.wordpress.version).toBe('6.4.2');
    expect(j.data.report?.gravity_smtp).toBeDefined();
  });

  it('returns only benign mock data without the exploit query', async () => {
    const j = (await gravitySmtpSystemReport(ctx('')).json()) as {
      data: { report?: unknown; total?: number };
    };
    expect(j.data.report).toBeUndefined();
    expect(j.data.total).toBe(0);
  });

  it('uses only policy-compliant fabricated secrets and domains', async () => {
    const text = await gravitySmtpSystemReport(ctx('?page=gravitysmtp-settings')).text();
    expect(text).toContain('.invalid');
    expect(text).toContain('REDACTED_FOR_HONEYPOT');
    expect(text).toContain('EXAMPLE_AKIA1234567890ABCDEF');
    // No bare real-looking secret values leaked.
    expect(text).not.toContain('smtp_password');
  });

  it('emits no honeypot canary header', () => {
    const res = gravitySmtpSystemReport(ctx('?page=gravitysmtp-settings'));
    for (const [k] of res.headers.entries()) {
      expect(k.toLowerCase()).not.toContain('honeypot');
    }
  });
});
