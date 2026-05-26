import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for Drupal's `settings.php` (the per-site config under
// `sites/default/settings.php`). The disclosure exposes the
// `$databases['default']['default']` array (DB host + username +
// password + driver), the `$settings['hash_salt']` used for the
// session-cookie HMAC, and the `$config_directories` /
// `$config['system.file']['path']['temporary']` paths. CWE-200 /
// CWE-538 disclosure class.
//
// We render the canonical Drupal 8+ shape with placeholder values.

const body = `<?php

$databases['default']['default'] = [
  'database' => 'example_drupal',
  'username' => 'app_user',
  'password' => 'REDACTED_FOR_HONEYPOT',
  'prefix' => '',
  'host' => 'db.example.invalid',
  'port' => '3306',
  'namespace' => 'Drupal\\\\Core\\\\Database\\\\Driver\\\\mysql',
  'driver' => 'mysql',
];

$settings['hash_salt'] = 'REDACTED_FOR_HONEYPOT';

$settings['update_free_access'] = FALSE;

$settings['container_yamls'][] = $app_root . '/' . $site_path . '/services.yml';

$settings['file_scan_ignore_directories'] = [
  'node_modules',
  'bower_components',
];

$settings['entity_update_batch_size'] = 50;

$config_directories['sync'] = $app_root . '/' . $site_path . '/files/config/sync';

$settings['trusted_host_patterns'] = [
  '^app\\\\.example\\\\.invalid$',
];

# To use a real cache backend:
# $settings['cache']['default'] = 'cache.backend.redis';
# $settings['redis.connection']['host'] = 'redis.example.invalid';
# $settings['redis.connection']['password'] = 'REDACTED_FOR_HONEYPOT';
`;

export const drupalSettingsPhp: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/x-php; charset=UTF-8' },
  });
};
