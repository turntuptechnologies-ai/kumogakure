import { describe, expect, it } from 'vitest';
import { fakeAwsCredentialsJson } from '../../../src/bait/templates/fake-aws-credentials-json.js';

const ctx = (path: string) => ({
  request: new Request(`http://example.test${path}`),
  path,
  category: 'config-leak' as const,
  subcategory: 'cloud-credentials',
});

describe('fake-aws-credentials-json', () => {
  it('returns well-formed JSON with SDK-style AWS key fields', async () => {
    const response = fakeAwsCredentialsJson(ctx('/aws-credentials.json'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const json = (await response.json()) as {
      accessKeyId: string;
      secretAccessKey: string;
      region: string;
    };
    expect(json.accessKeyId).toMatch(/^EXAMPLE_/);
    expect(json.secretAccessKey).toBe('REDACTED_FOR_HONEYPOT');
    expect(json.region).toBe('us-east-1');
  });

  it('carries only non-actionable placeholder values', async () => {
    const text = await fakeAwsCredentialsJson(ctx('/aws-credentials.json')).text();
    expect(text).not.toMatch(/AKIA[0-9A-Z]{16}$/m); // no real-shaped live key
    expect(text).toContain('REDACTED_FOR_HONEYPOT');
  });

  it('emits no canary / tracking headers', () => {
    const response = fakeAwsCredentialsJson(ctx('/aws-credentials.json'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
