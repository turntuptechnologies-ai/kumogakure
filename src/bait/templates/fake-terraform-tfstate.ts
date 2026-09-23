import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for Terraform state files — `terraform.tfstate` and
// `terraform.tfstate.backup`, at any depth. State stores every managed
// resource's attributes in plaintext JSON, including the ones marked
// `sensitive` (DB master passwords, IAM secret keys), so an exposed state
// file is a direct credential leak (CWE-200 / CWE-312). The JSON sibling of
// the fake-terraform-tfvars HCL decoy.
//
// Format-valid v4 state. Hosts are `.invalid`, the access key id is
// `EXAMPLE_`-prefixed, secrets are `REDACTED_FOR_HONEYPOT`, and the account
// id is a fabricated 12-digit placeholder. Fully static.

const body = JSON.stringify(
  {
    version: 4,
    terraform_version: '1.9.5',
    serial: 42,
    lineage: '3f8a2c1e-7b4d-4e9f-a6c0-5d1b2e8f9a37',
    outputs: {
      db_endpoint: {
        value: 'db.example.invalid:5432',
        type: 'string',
      },
    },
    resources: [
      {
        mode: 'managed',
        type: 'aws_db_instance',
        name: 'main',
        provider: 'provider["registry.terraform.io/hashicorp/aws"]',
        instances: [
          {
            schema_version: 2,
            attributes: {
              identifier: 'example-prod',
              engine: 'postgres',
              engine_version: '16.3',
              instance_class: 'db.t3.medium',
              address: 'db.example.invalid',
              port: 5432,
              db_name: 'example',
              username: 'app_admin',
              password: 'REDACTED_FOR_HONEYPOT',
            },
            sensitive_attributes: [[{ type: 'get_attr', value: 'password' }]],
          },
        ],
      },
      {
        mode: 'managed',
        type: 'aws_iam_access_key',
        name: 'deploy',
        provider: 'provider["registry.terraform.io/hashicorp/aws"]',
        instances: [
          {
            schema_version: 0,
            attributes: {
              id: 'EXAMPLE_AKIA1234567890ABCDEF',
              user: 'example-deploy',
              secret: 'REDACTED_FOR_HONEYPOT',
              status: 'Active',
            },
            sensitive_attributes: [[{ type: 'get_attr', value: 'secret' }]],
          },
        ],
      },
      {
        mode: 'managed',
        type: 'aws_s3_bucket',
        name: 'assets',
        provider: 'provider["registry.terraform.io/hashicorp/aws"]',
        instances: [
          {
            schema_version: 0,
            attributes: {
              bucket: 'example-app-assets',
              arn: 'arn:aws:s3:::example-app-assets',
              region: 'us-east-1',
            },
            sensitive_attributes: [],
          },
        ],
      },
    ],
    check_results: null,
  },
  null,
  2,
);

export const fakeTerraformTfstate: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
  });
};
