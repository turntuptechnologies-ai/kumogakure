import { describe, expect, it } from 'vitest';
import { fakeTerraformTfstate } from '../../../src/bait/templates/fake-terraform-tfstate.js';

const ctx = (path: string) => ({
  request: new Request(`http://example.test${path}`),
  path,
  category: 'config-leak' as const,
  subcategory: 'terraform',
});

interface State {
  version: number;
  terraform_version: string;
  resources: Array<{ type: string; instances: Array<{ attributes: Record<string, unknown> }> }>;
}

describe('fake-terraform-tfstate', () => {
  it('returns format-valid v4 Terraform state JSON', async () => {
    const response = fakeTerraformTfstate(ctx('/terraform.tfstate'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const state = (await response.json()) as State;
    expect(state.version).toBe(4);
    expect(state.terraform_version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(state.resources.map((r) => r.type)).toContain('aws_db_instance');
  });

  it('carries only placeholder secrets and .invalid hosts', async () => {
    const state = (await fakeTerraformTfstate(ctx('/terraform.tfstate')).json()) as State;
    const attrs = Object.fromEntries(
      state.resources.map((r) => [r.type, r.instances[0]?.attributes ?? {}]),
    );
    expect(attrs.aws_db_instance?.password).toBe('REDACTED_FOR_HONEYPOT');
    expect(attrs.aws_db_instance?.address).toBe('db.example.invalid');
    expect(attrs.aws_iam_access_key?.id).toMatch(/^EXAMPLE_/);
    expect(attrs.aws_iam_access_key?.secret).toBe('REDACTED_FOR_HONEYPOT');
  });

  it('emits no canary / tracking headers', () => {
    const response = fakeTerraformTfstate(ctx('/terraform.tfstate'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
