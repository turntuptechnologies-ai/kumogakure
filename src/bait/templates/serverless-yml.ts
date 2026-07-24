import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for the Serverless Framework service definition
// (`serverless.yml` / `serverless.yaml`). Two things make it a scanner
// target when a deployment directory is served as static files
// (CWE-200 / CWE-538):
//
//   1. `provider.environment` is the idiomatic place to put runtime config,
//      so real services routinely leave plaintext database URLs and API keys
//      in it rather than referencing SSM / Secrets Manager.
//   2. Everything else in the file maps the deployment — IAM statements,
//      bucket and table ARNs, queue names, handler paths, stage names.
//
// We render a plausible AWS service with both of those surfaces present:
// environment values that look like secrets but are placeholders, and ARNs
// on the all-zero account id (never issued by AWS). Hosts are `.invalid`.
// Fully static; never reflects the request.

const body = `service: example-api

frameworkVersion: '3'

provider:
  name: aws
  runtime: nodejs20.x
  region: us-east-1
  stage: \${opt:stage, 'production'}
  memorySize: 512
  timeout: 30
  logRetentionInDays: 30
  environment:
    NODE_ENV: production
    API_BASE_URL: https://api.example.invalid
    DATABASE_URL: postgres://app_user:REDACTED_FOR_HONEYPOT@db.internal.invalid:5432/example
    REDIS_URL: redis://cache.internal.invalid:6379
    JWT_SECRET: REDACTED_FOR_HONEYPOT
    SESSION_TABLE: example-sessions
    UPLOAD_BUCKET: example-uploads
  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - s3:GetObject
            - s3:PutObject
          Resource: arn:aws:s3:::example-uploads/*
        - Effect: Allow
          Action:
            - dynamodb:GetItem
            - dynamodb:PutItem
            - dynamodb:Query
          Resource: arn:aws:dynamodb:us-east-1:000000000000:table/example-sessions
        - Effect: Allow
          Action:
            - sqs:ReceiveMessage
            - sqs:DeleteMessage
          Resource: arn:aws:sqs:us-east-1:000000000000:example-jobs

functions:
  api:
    handler: src/handlers/api.handler
    events:
      - httpApi:
          path: /{proxy+}
          method: any
  worker:
    handler: src/handlers/worker.handler
    events:
      - sqs:
          arn: arn:aws:sqs:us-east-1:000000000000:example-jobs
          batchSize: 10
  nightly:
    handler: src/handlers/nightly.handler
    events:
      - schedule: cron(15 3 * * ? *)

plugins:
  - serverless-esbuild
  - serverless-offline

package:
  patterns:
    - '!node_modules/.cache/**'
    - '!.env*'
    - '!tests/**'
`;

export const serverlessYml: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/x-yaml; charset=UTF-8' },
  });
};
