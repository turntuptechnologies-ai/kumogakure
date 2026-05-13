import type { TemplateFn } from '../../types.js';

const body = `<?php
/**
 * Configuration for example-honeypot.invalid
 */
define( 'DB_NAME', 'example_db' );
define( 'DB_USER', 'db_user' );
define( 'DB_PASSWORD', 'REDACTED_FOR_HONEYPOT' );
define( 'DB_HOST', 'localhost' );
define( 'DB_CHARSET', 'utf8mb4' );
define( 'DB_COLLATE', '' );

define( 'AUTH_KEY',         'EXAMPLE_AUTH_KEY_NOT_FUNCTIONAL_DO_NOT_USE' );
define( 'SECURE_AUTH_KEY',  'EXAMPLE_SECURE_AUTH_KEY_NOT_FUNCTIONAL' );
define( 'LOGGED_IN_KEY',    'EXAMPLE_LOGGED_IN_KEY_NOT_FUNCTIONAL' );
define( 'NONCE_KEY',        'EXAMPLE_NONCE_KEY_NOT_FUNCTIONAL' );
define( 'AUTH_SALT',        'EXAMPLE_AUTH_SALT_NOT_FUNCTIONAL' );
define( 'SECURE_AUTH_SALT', 'EXAMPLE_SECURE_AUTH_SALT_NOT_FUNCTIONAL' );
define( 'LOGGED_IN_SALT',   'EXAMPLE_LOGGED_IN_SALT_NOT_FUNCTIONAL' );
define( 'NONCE_SALT',       'EXAMPLE_NONCE_SALT_NOT_FUNCTIONAL' );

$table_prefix = 'wp_';
define( 'WP_DEBUG', false );

if ( ! defined( 'ABSPATH' ) ) {
\tdefine( 'ABSPATH', __DIR__ . '/' );
}
require_once ABSPATH . 'wp-settings.php';
`;

export const fakeWpConfig: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
  });
};
