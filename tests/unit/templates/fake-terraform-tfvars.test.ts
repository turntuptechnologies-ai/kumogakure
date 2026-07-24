import { describe, expect, it } from 'vitest';
import { fakeTerraformTfvars } from '../../../src/bait/templates/fake-terraform-tfvars.js';

const ctx = () => ({
  request: new Request('http://example.test/terraform.tfvars'),
  path: '/terraform.tfvars',
  category: 'config-leak' as const,
  subcategory: 'terraform',
});

describe('fake-terraform-tfvars', () => {
  it('serves plausible HCL variable assignments as text', async () => {
    const response = fakeTerraformTfvars(ctx());
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    const text = await response.text();
    expect(text).toMatch(/^project_name\s+=\s+"/m);
    expect(text).toMatch(/^db_username\s+=\s+"/m);
    expect(text).toMatch(/^tags = \{$/m);
  });

  it('leaves every secret-shaped value as the non-actionable placeholder', async () => {
    const text = await fakeTerraformTfvars(ctx()).text();
    const secretLines = text
      .split('\n')
      .filter((line) => /^\s*\w*(?:password|secret|token|api_key)\w*\s*=/i.test(line));
    expect(secretLines.length).toBeGreaterThan(0);
    for (const line of secretLines) {
      expect(line, line).toMatch(/=\s*"REDACTED_FOR_HONEYPOT"$/);
    }
  });

  it('points every host, URL and address at the non-routable .invalid TLD', async () => {
    const text = await fakeTerraformTfvars(ctx()).text();
    const hostLines = text
      .split('\n')
      .filter((line) => /^\s*\w*(?:host|url|email|origins)\w*\s*=/i.test(line));
    expect(hostLines.length).toBeGreaterThan(0);
    for (const line of hostLines) expect(line, line).toContain('.invalid');
  });

  it('emits no canary / tracking headers', () => {
    const response = fakeTerraformTfvars(ctx());
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
