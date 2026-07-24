import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for Terraform variable-definition files — `terraform.tfvars`,
// `prod.tfvars`, `*.auto.tfvars`, `*.tfvars.json`. By convention `.tfvars` is
// where operators keep exactly the values they do not want in version control
// (DB passwords, cloud credentials, monitoring/API tokens), which is why the
// file is gitignored in every published Terraform template — and why scanners
// sweep for it when a repo or build directory is served as static files
// (CWE-200 / CWE-538).
//
// We render a plausible production workspace: real HCL shape and a full
// variable set (network, database, observability), with every secret-shaped
// value replaced by a placeholder and every host on the non-resolvable
// `.invalid` TLD. Fully static; never reflects the request.

const body = `# Values for the production workspace.
# terraform apply -var-file=terraform.tfvars

project_name = "example-platform"
environment  = "production"
region       = "us-east-1"
owner_email  = "platform@example.invalid"

vpc_cidr        = "10.20.0.0/16"
private_subnets = ["10.20.1.0/24", "10.20.2.0/24", "10.20.3.0/24"]
public_subnets  = ["10.20.101.0/24", "10.20.102.0/24", "10.20.103.0/24"]

db_engine_version = "15.5"
db_instance_class = "db.t4g.medium"
db_allocated_gb   = 200
db_multi_az       = true
db_host           = "db.internal.invalid"
db_name           = "example"
db_username       = "app_user"
db_password       = "REDACTED_FOR_HONEYPOT"

redis_host       = "cache.internal.invalid"
redis_auth_token = "REDACTED_FOR_HONEYPOT"

api_base_url    = "https://api.example.invalid"
allowed_origins = ["https://app.example.invalid"]

datadog_api_key = "REDACTED_FOR_HONEYPOT"
smtp_host       = "smtp.example.invalid"
smtp_username   = "mailer@example.invalid"
smtp_password   = "REDACTED_FOR_HONEYPOT"

tags = {
  ManagedBy   = "terraform"
  Environment = "production"
  CostCenter  = "platform"
}
`;

export const fakeTerraformTfvars: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
  });
};
