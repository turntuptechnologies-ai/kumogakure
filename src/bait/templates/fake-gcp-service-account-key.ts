import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for GCP service-account JSON key file probes. Returns
// the standard service-account key shape (the format Google generates)
// with an invented `project_id` / `client_email` and a non-actionable
// placeholder PEM. The standard OAuth URIs (`accounts.google.com`,
// `oauth2.googleapis.com`, …) are part of the file *format*, not org
// attribution — analogous to how `fake-s3cfg` writes
// `host_base = s3.amazonaws.com` as the s3cmd config convention. No
// canary.

const body = JSON.stringify(
  {
    type: 'service_account',
    project_id: 'honeypot-example',
    private_key_id: '0000000000000000000000000000000000000000',
    private_key: '-----BEGIN PRIVATE KEY-----\nREDACTED_FOR_HONEYPOT\n-----END PRIVATE KEY-----\n',
    client_email: 'honeypot-sa@honeypot-example.iam.gserviceaccount.com',
    client_id: '000000000000000000000',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url:
      'https://www.googleapis.com/robot/v1/metadata/x509/honeypot-sa%40honeypot-example.iam.gserviceaccount.com',
    universe_domain: 'googleapis.com',
  },
  null,
  2,
);

export const fakeGcpServiceAccountKey: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
  });
};
