import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for phpMyAdmin's `config.inc.php` under the usual install
// directories (`/phpmyadmin/`, `/phpMyAdmin/`, `/pma/`, …). Served as source
// when PHP is misconfigured, it discloses `$cfg['blowfish_secret']` (the
// cookie-auth encryption key) and the server / controluser credentials
// (CWE-200 / CWE-538). Same shape as the `config.sample.inc.php` phpMyAdmin
// ships, filled in the way an operator would.
//
// Hosts are `.invalid`, every secret is `REDACTED_FOR_HONEYPOT`. Fully
// static; the request is never reflected.

const body = `<?php
/**
 * phpMyAdmin configuration file
 */

declare(strict_types=1);

$cfg['blowfish_secret'] = 'REDACTED_FOR_HONEYPOT';

$i = 0;

/**
 * First server
 */
$i++;
$cfg['Servers'][$i]['auth_type'] = 'cookie';
$cfg['Servers'][$i]['host'] = 'db.example.invalid';
$cfg['Servers'][$i]['port'] = '3306';
$cfg['Servers'][$i]['compress'] = false;
$cfg['Servers'][$i]['AllowNoPassword'] = false;

/**
 * phpMyAdmin configuration storage settings.
 */
$cfg['Servers'][$i]['controlhost'] = 'db.example.invalid';
$cfg['Servers'][$i]['controlport'] = '3306';
$cfg['Servers'][$i]['controluser'] = 'pma';
$cfg['Servers'][$i]['controlpass'] = 'REDACTED_FOR_HONEYPOT';
$cfg['Servers'][$i]['pmadb'] = 'phpmyadmin';
$cfg['Servers'][$i]['bookmarktable'] = 'pma__bookmark';
$cfg['Servers'][$i]['relation'] = 'pma__relation';
$cfg['Servers'][$i]['table_info'] = 'pma__table_info';
$cfg['Servers'][$i]['pdf_pages'] = 'pma__pdf_pages';
$cfg['Servers'][$i]['column_info'] = 'pma__column_info';
$cfg['Servers'][$i]['history'] = 'pma__history';
$cfg['Servers'][$i]['recent'] = 'pma__recent';
$cfg['Servers'][$i]['favorite'] = 'pma__favorite';
$cfg['Servers'][$i]['users'] = 'pma__users';
$cfg['Servers'][$i]['usergroups'] = 'pma__usergroups';

/**
 * Directories for saving/loading files from server
 */
$cfg['UploadDir'] = '';
$cfg['SaveDir'] = '';
$cfg['TempDir'] = '/var/lib/phpmyadmin/tmp';
`;

export const phpmyadminConfigInc: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/x-php; charset=UTF-8' },
  });
};
