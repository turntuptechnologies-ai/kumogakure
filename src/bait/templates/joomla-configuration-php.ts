import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for Joomla's `configuration.php`. The file is Joomla's
// single source of truth for DB credentials, secret salt, mailer
// SMTP credentials, and FTP credentials — all as public properties
// of `class JConfig`. When PHP fails to execute and the file is
// served as source, every value leaks in cleartext. CWE-200 / CWE-538
// disclosure class. No single product CVE; this is the "misconfigured
// to serve .php as text" misconfiguration.
//
// We render the canonical JConfig shape with placeholder values —
// `.invalid` DB/mailer hosts and `REDACTED_FOR_HONEYPOT` secrets.

const body = `<?php
class JConfig {
\tpublic $offline = '0';
\tpublic $offline_message = 'This site is down for maintenance.<br />Please check back again soon.';
\tpublic $display_offline_message = '1';
\tpublic $offline_image = '';
\tpublic $sitename = 'Example Site';
\tpublic $editor = 'tinymce';
\tpublic $captcha = '0';
\tpublic $list_limit = '20';
\tpublic $access = '1';
\tpublic $debug = '0';
\tpublic $debug_lang = '0';
\tpublic $dbtype = 'mysqli';
\tpublic $host = 'db.example.invalid';
\tpublic $user = 'app_user';
\tpublic $password = 'REDACTED_FOR_HONEYPOT';
\tpublic $db = 'example_joomla';
\tpublic $dbprefix = 'jos_';
\tpublic $live_site = '';
\tpublic $secret = 'REDACTED_FOR_HONEYPOT';
\tpublic $gzip = '0';
\tpublic $error_reporting = 'default';
\tpublic $helpurl = 'https://help.example.invalid/{major}{minor}/{langcode}';
\tpublic $ftp_host = '127.0.0.1';
\tpublic $ftp_port = '21';
\tpublic $ftp_user = '';
\tpublic $ftp_pass = '';
\tpublic $ftp_root = '';
\tpublic $ftp_enable = '0';
\tpublic $offset = 'UTC';
\tpublic $mailonline = '1';
\tpublic $mailer = 'smtp';
\tpublic $mailfrom = 'no-reply@example.invalid';
\tpublic $fromname = 'Example Site';
\tpublic $sendmail = '/usr/sbin/sendmail';
\tpublic $smtpauth = '1';
\tpublic $smtpuser = 'mailer@example.invalid';
\tpublic $smtppass = 'REDACTED_FOR_HONEYPOT';
\tpublic $smtphost = 'smtp.example.invalid';
\tpublic $smtpport = '465';
\tpublic $smtpsecure = 'ssl';
\tpublic $caching = '0';
\tpublic $cache_handler = 'file';
\tpublic $cachetime = '15';
\tpublic $MetaDesc = '';
\tpublic $MetaKeys = '';
\tpublic $MetaTitle = '1';
\tpublic $MetaAuthor = '1';
\tpublic $MetaVersion = '0';
\tpublic $robots = '';
\tpublic $sef = '1';
\tpublic $sef_rewrite = '0';
\tpublic $sef_suffix = '0';
\tpublic $unicodeslugs = '0';
\tpublic $feed_limit = '10';
\tpublic $log_path = '/var/www/html/administrator/logs';
\tpublic $tmp_path = '/var/www/html/tmp';
\tpublic $lifetime = '15';
\tpublic $session_handler = 'database';
}
`;

export const joomlaConfigurationPhp: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/x-php; charset=UTF-8' },
  });
};
