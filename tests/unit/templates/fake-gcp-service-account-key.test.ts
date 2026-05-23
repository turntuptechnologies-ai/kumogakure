import { describe, expect, it } from 'vitest';
import { fakeGcpServiceAccountKey } from '../../../src/bait/templates/fake-gcp-service-account-key.js';

const ctx = (method: string) => ({
  request: new Request('http://example.test/keyfile.json', { method }),
  path: '/keyfile.json',
  category: 'config-leak' as const,
  subcategory: 'cloud-credentials',
});

describe('fake-gcp-service-account-key', () => {
  it('returns a 200 JSON response shaped like a GCP service-account key', async () => {
    const response = fakeGcpServiceAccountKey(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const body = await response.text();
    const parsed = JSON.parse(body);
    expect(parsed.type).toBe('service_account');
    expect(parsed.project_id).toBe('honeypot-example');
    expect(parsed.client_email).toBe('honeypot-sa@honeypot-example.iam.gserviceaccount.com');
    // Standard OAuth / certs URIs are part of the file format.
    expect(parsed.auth_uri).toBe('https://accounts.google.com/o/oauth2/auth');
    expect(parsed.token_uri).toBe('https://oauth2.googleapis.com/token');
  });

  it('uses a non-actionable placeholder private key', async () => {
    const response = fakeGcpServiceAccountKey(ctx('GET'));
    const body = await response.text();
    expect(body).toContain('-----BEGIN PRIVATE KEY-----');
    expect(body).toContain('REDACTED_FOR_HONEYPOT');
    expect(body).toContain('-----END PRIVATE KEY-----');
  });

  it('emits no canary / tracking headers', () => {
    const response = fakeGcpServiceAccountKey(ctx('GET'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
