import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for the generic PHP "DB config" filename family:
// `/database.php` (Laravel `config/database.php` style — returns an
// array of connection definitions) and the common custom-PHP
// `/db.php` (procedural `$dbhost / $dbuser / $dbpass` definitions).
// Both leak DB credentials in cleartext when served as source —
// CWE-200 / CWE-538.
//
// We return the Laravel-style `return [...]` shape since it's the
// more common modern convention and covers both probe families
// equally well (the procedural-style scanner still gets a positive
// "DB config" hit on the array form).

const body = `<?php

return [
\t'default' => 'mysql',

\t'connections' => [
\t\t'mysql' => [
\t\t\t'driver' => 'mysql',
\t\t\t'host' => 'db.example.invalid',
\t\t\t'port' => '3306',
\t\t\t'database' => 'example',
\t\t\t'username' => 'app_user',
\t\t\t'password' => 'REDACTED_FOR_HONEYPOT',
\t\t\t'unix_socket' => '',
\t\t\t'charset' => 'utf8mb4',
\t\t\t'collation' => 'utf8mb4_unicode_ci',
\t\t\t'prefix' => '',
\t\t\t'strict' => true,
\t\t\t'engine' => null,
\t\t],

\t\t'pgsql' => [
\t\t\t'driver' => 'pgsql',
\t\t\t'host' => 'db.example.invalid',
\t\t\t'port' => '5432',
\t\t\t'database' => 'example',
\t\t\t'username' => 'app_user',
\t\t\t'password' => 'REDACTED_FOR_HONEYPOT',
\t\t\t'charset' => 'utf8',
\t\t\t'prefix' => '',
\t\t\t'schema' => 'public',
\t\t\t'sslmode' => 'prefer',
\t\t],

\t\t'redis' => [
\t\t\t'host' => 'redis.example.invalid',
\t\t\t'password' => 'REDACTED_FOR_HONEYPOT',
\t\t\t'port' => 6379,
\t\t\t'database' => 0,
\t\t],
\t],

\t'migrations' => 'migrations',
];
`;

export const phpDatabaseConfig: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/x-php; charset=UTF-8' },
  });
};
