import { describe, expect, it } from 'vitest';
import { serverlessYml } from '../../../src/bait/templates/serverless-yml.js';

const ctx = () => ({
  request: new Request('http://example.test/serverless.yml'),
  path: '/serverless.yml',
  category: 'config-leak' as const,
  subcategory: 'serverless-framework',
});

describe('serverless-yml', () => {
  it('serves a plausible service definition as YAML', async () => {
    const response = serverlessYml(ctx());
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('yaml');
    const text = await response.text();
    expect(text).toMatch(/^service:/m);
    expect(text).toMatch(/^provider:/m);
    expect(text).toMatch(/^functions:/m);
    // The two surfaces that make the file worth stealing.
    expect(text).toContain('environment:');
    expect(text).toContain('statements:');
  });

  it('leaves every secret-shaped environment value as the placeholder', async () => {
    const text = await serverlessYml(ctx()).text();
    const secretLines = text
      .split('\n')
      .filter((line) => /^\s*\w*(?:SECRET|TOKEN|PASSWORD|API_KEY)\w*:/i.test(line));
    expect(secretLines.length).toBeGreaterThan(0);
    for (const line of secretLines) {
      expect(line, line).toMatch(/:\s*REDACTED_FOR_HONEYPOT$/);
    }
    // The DSN carries its password inline, so check it separately.
    expect(text).toContain('postgres://app_user:REDACTED_FOR_HONEYPOT@db.internal.invalid');
  });

  it('uses only non-routable .invalid hosts', async () => {
    const text = await serverlessYml(ctx()).text();
    const urls = text.match(/[a-z][a-z0-9+.-]*:\/\/[^\s'"]+/gi) ?? [];
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) expect(url, url).toContain('.invalid');
  });

  it('uses the never-issued all-zero AWS account id in ARNs', async () => {
    const text = await serverlessYml(ctx()).text();
    const arns = text.match(/arn:aws:[^\s]+/g) ?? [];
    expect(arns.length).toBeGreaterThan(0);
    for (const arn of arns) {
      const accountId = arn.split(':')[4];
      // s3 ARNs have an empty account segment; the rest must be all-zero.
      if (accountId) expect(accountId, arn).toBe('000000000000');
    }
  });

  it('emits no canary / tracking headers', () => {
    const response = serverlessYml(ctx());
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
