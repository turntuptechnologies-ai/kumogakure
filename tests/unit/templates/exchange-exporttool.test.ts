import { describe, expect, it } from 'vitest';
import { exchangeExporttool } from '../../../src/bait/templates/exchange-exporttool.js';

const path = '/ecp/Current/exporttool/microsoft.exchange.ediscovery.exporttool.application';

const ctx = (method: string) => ({
  request: new Request(`http://example.test${path}`, { method }),
  path,
  category: 'cve-recon' as const,
  subcategory: 'exchange',
});

describe('exchange-exporttool', () => {
  it('returns a ClickOnce .application manifest with the expected envelope', async () => {
    const response = exchangeExporttool(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/x-ms-application');
    const body = await response.text();
    expect(body).toContain('<?xml version="1.0" encoding="utf-8"?>');
    expect(body).toContain('<asmv1:assembly');
    expect(body).toContain('name="microsoft.exchange.ediscovery.exporttool.application"');
    expect(body).toContain('REDACTED_FOR_HONEYPOT');
  });

  it('uses placeholder publicKeyToken / issuerKeyHash', async () => {
    const response = exchangeExporttool(ctx('GET'));
    const body = await response.text();
    // Not the value of any real signing key.
    expect(body).toContain('publicKeyToken="0000000000000000"');
  });

  it('emits no canary / tracking headers', () => {
    const response = exchangeExporttool(ctx('GET'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
