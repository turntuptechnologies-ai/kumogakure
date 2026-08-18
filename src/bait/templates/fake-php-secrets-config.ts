import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for the generic CodeIgniter/Laravel `config/<name>.php`
// directory convention — `config.php`, `conf.php`, `admin/config.php`,
// `local.config.php`, and the `config/{smtp,credentials,mail,mailer,
// email,api,services,keys,app}.php` basenames all get one shared decoy
// (see the combined pattern in patterns.ts), since scanners spray the
// whole basename set together and the value is in confirming "a PHP
// config array is fetchable here", not in mimicking each product exactly.
// `config/database.php` is the one basename in this family with a
// higher-fidelity, product-specific decoy (php-database-config.ts,
// Laravel's real `config/database.php` shape) and is routed there
// separately.

const body = `<?php

return [
\t'key' => 'REDACTED_FOR_HONEYPOT',
\t'secret' => 'REDACTED_FOR_HONEYPOT',
\t'api_key' => 'REDACTED_FOR_HONEYPOT',

\t'mail' => [
\t\t'driver' => 'smtp',
\t\t'host' => 'smtp.example.invalid',
\t\t'port' => 587,
\t\t'username' => 'mailer@example.invalid',
\t\t'password' => 'REDACTED_FOR_HONEYPOT',
\t\t'encryption' => 'tls',
\t],
];
`;

export const fakePhpSecretsConfig: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/x-php; charset=UTF-8' },
  });
};
