import { describe, expect, it } from 'vitest';
import { confluenceTextInline } from '../../../src/bait/templates/confluence-text-inline.js';

const ctx = (path: string, init?: RequestInit) => ({
  request: new Request(`http://example.test${path}`, init),
  path,
  category: 'cve-recon' as const,
  subcategory: 'confluence',
});

describe('confluence-text-inline', () => {
  it('returns a 200 AUI fragment for the text-inline.vm probe', async () => {
    const response = confluenceTextInline(ctx('/template/aui/text-inline.vm'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    const html = await response.text();
    expect(html).toContain('aui-inline-edit');
  });

  it('never evaluates or reflects the OGNL payload (CVE-2021-26084 capture, not execution)', async () => {
    // The classic CVE-2021-26084 detection payload performs arithmetic
    // (233*157 = 36581) via OGNL and checks the response for the result.
    // A static body cannot evaluate it, and the raw payload must not be
    // echoed back either (no reflected-content / XSS surface).
    const payload = "aaa'%2b#{233*157}%2b'<script>alert(1)</script>";
    const response = confluenceTextInline(
      ctx('/template/aui/text-inline.vm', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: `queryString=${payload}`,
      }),
    );
    const html = await response.text();
    expect(html).not.toContain('36581');
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).not.toContain(payload);
  });

  it('emits no canary / tracking headers', () => {
    const response = confluenceTextInline(ctx('/template/aui/text-inline.vm'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
