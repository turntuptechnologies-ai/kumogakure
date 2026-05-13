import { describe, expect, it } from 'vitest';
import { fingerprintHeaders } from '../../../src/fingerprint/headers.js';

describe('fingerprintHeaders', () => {
  it('always sets a Server header', () => {
    const headers = fingerprintHeaders('cms-auth');
    expect(headers.Server).toBeTruthy();
  });

  it('sets X-Powered-By for PHP-flavoured bait categories', () => {
    for (const category of ['cms-auth', 'config-leak', 'webshell'] as const) {
      expect(fingerprintHeaders(category)['X-Powered-By']).toContain('PHP');
    }
  });

  it('omits X-Powered-By for non-PHP bait categories', () => {
    for (const category of ['cve-recon', 'ssrf-bait', 'api-recon', 'iot-recon'] as const) {
      expect(fingerprintHeaders(category)['X-Powered-By']).toBeUndefined();
    }
  });

  it('selects the SSRF bait Server header from the AWS metadata pool', () => {
    expect(fingerprintHeaders('ssrf-bait').Server).toBe('EC2ws');
  });

  it('selects an IoT-style Server header for iot-recon', () => {
    const server = fingerprintHeaders('iot-recon').Server;
    expect(server).toMatch(/lighttpd|Boa/);
  });
});
