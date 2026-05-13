import { describe, expect, it } from 'vitest';
import { fakeEnv } from '../../../src/bait/templates/fake-env.js';

const ctx = (method: string) => ({
  request: new Request('http://example.test/.env', { method }),
  path: '/.env',
  category: 'config-leak' as const,
  subcategory: 'dotenv',
});

describe('fake-env', () => {
  it('returns 200 plain text body', async () => {
    const response = fakeEnv(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    const body = await response.text();
    expect(body).toContain('APP_NAME=');
    expect(body).toContain('DB_PASSWORD=REDACTED_FOR_HONEYPOT');
    expect(body).toContain('AWS_ACCESS_KEY_ID=EXAMPLE_AKIA');
  });

  it('uses .invalid TLD for fake domains', async () => {
    const response = fakeEnv(ctx('GET'));
    const body = await response.text();
    expect(body).toContain('example.invalid');
    expect(body).not.toMatch(/\b[a-z0-9]+\.com\b/);
  });
});
