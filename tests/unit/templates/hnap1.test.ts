import { describe, expect, it } from 'vitest';
import { hnap1 } from '../../../src/bait/templates/hnap1.js';

const ctx = {
  request: new Request('http://example.test/HNAP1/'),
  path: '/HNAP1/',
  category: 'iot-recon' as const,
  subcategory: 'dlink',
};

describe('hnap1', () => {
  it('returns a SOAP envelope with HNAP-style device settings', async () => {
    const response = hnap1(ctx);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/xml');
    const body = await response.text();
    expect(body).toContain('soap:Envelope');
    expect(body).toContain('GetDeviceSettingsResponse');
    expect(body).toContain('GatewayWithWiFi');
  });
});
