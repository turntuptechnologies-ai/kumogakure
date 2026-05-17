import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for CVE-2026-4020 (Gravity SMTP <= 2.1.4): the
// unauthenticated REST route /wp-json/gravitysmtp/v1/tests/mock-data
// returns a ~365 KB "System Report" when ?page=gravitysmtp-settings is
// present. We make the exploit appear to succeed so the attacker's
// follow-on behaviour is captured. All values are fabricated and
// policy-compliant (docs/RESPONSE_TEMPLATE_POLICY.md): `.invalid`
// hosts, non-actionable placeholder secrets, invented plugin/theme
// slugs (no third-party trademark attribution), no canary. The query
// is only compared against a constant — never reflected.

const systemReport = JSON.stringify({
  success: true,
  data: {
    report: {
      server: {
        software: 'nginx/1.18.0',
        php_version: '7.4.33',
        php_sapi: 'fpm-fcgi',
        document_root: '/var/www/html',
        loaded_extensions: ['core', 'curl', 'mbstring', 'openssl', 'pdo_mysql', 'json', 'zip'],
      },
      database: {
        server: 'MySQL',
        version: '5.7.42',
        host: 'db.example.invalid',
        name: 'wp_example',
        user: 'wp_user',
        password: 'REDACTED_FOR_HONEYPOT',
        table_prefix: 'wp_',
        tables: ['wp_options', 'wp_users', 'wp_usermeta', 'wp_posts', 'wp_postmeta'],
      },
      wordpress: {
        version: '6.4.2',
        site_url: 'https://app.example.invalid',
        home_url: 'https://app.example.invalid',
        multisite: false,
        debug: false,
        active_theme: { name: 'example-theme', version: '1.2.0' },
        active_plugins: [
          { slug: 'gravity-smtp', version: '2.1.4' },
          { slug: 'contact-forms-lite', version: '3.4.1' },
          { slug: 'seo-toolkit', version: '8.0.5' },
          { slug: 'cache-optimizer', version: '2.6.0' },
        ],
      },
      gravity_smtp: {
        version: '2.1.4',
        default_connector: 'smtp',
        connectors: {
          smtp: {
            host: 'smtp.example.invalid',
            port: 587,
            encryption: 'tls',
            username: 'mailer@example.invalid',
            password: 'REDACTED_FOR_HONEYPOT',
          },
          sendgrid: { api_key: 'REDACTED_FOR_HONEYPOT' },
          ses: {
            access_key_id: 'EXAMPLE_AKIA1234567890ABCDEF',
            secret_access_key: 'REDACTED_FOR_HONEYPOT',
            region: 'us-east-1',
          },
        },
      },
    },
  },
});

const mockData = JSON.stringify({
  success: true,
  data: { events: [], total: 0 },
});

export const gravitySmtpSystemReport: TemplateFn = (ctx) => {
  let page = '';
  try {
    page = new URL(ctx.request.url).searchParams.get('page') ?? '';
  } catch {
    page = '';
  }
  const body = page === 'gravitysmtp-settings' ? systemReport : mockData;
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
  });
};
