import type { TemplateFn } from '../../types.js';

// Tier 1 decoy mimicking phpinfo() output — the single most-probed PHP
// misconfiguration. The recognizable table layout/CSS is reproduced
// (permitted by docs/RESPONSE_TEMPLATE_POLICY.md), but: no PHP logo
// image and no php.net attribution (A.2 trademark), `.invalid` hosts,
// non-actionable placeholders, fully static (no request reflection, so
// no reflected XSS), and no honeypot canary. The advertised version is
// deliberately an EOL release to maximise attacker engagement.

const body = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml"><head>
<style type="text/css">
body {background-color: #fff; color: #222; font-family: sans-serif;}
pre {margin: 0; font-family: monospace;}
a:link {color: #009; text-decoration: none; background-color: #fff;}
a:hover {text-decoration: underline;}
table {border-collapse: collapse; border: 0; width: 934px; box-shadow: 1px 2px 3px #ccc;}
.center {text-align: center;}
.center table {margin: 1em auto; text-align: left;}
.center th {text-align: center !important;}
td, th {border: 1px solid #666; font-size: 75%; vertical-align: baseline; padding: 4px 5px;}
h1 {font-size: 150%;} h2 {font-size: 125%;}
.p {text-align: left;}
.e {background-color: #ccf; width: 300px; font-weight: bold;}
.h {background-color: #99c; font-weight: bold;}
.v {background-color: #ddd; max-width: 300px; overflow-x: auto; word-wrap: break-word;}
.v i {color: #999;}
img {float: right; border: 0;}
hr {width: 934px; background-color: #ccc; border: 0; height: 1px;}
</style>
<title>phpinfo()</title><meta name="ROBOTS" content="NOINDEX,NOFOLLOW,NOARCHIVE" /></head>
<body><div class="center">
<table>
<tr class="h"><td>
<h1 class="p">PHP Version 7.4.33</h1>
</td></tr>
</table>
<table>
<tr><td class="e">System </td><td class="v">Linux web01 5.15.0-101-generic #111-Ubuntu SMP x86_64 </td></tr>
<tr><td class="e">Build Date </td><td class="v">Nov  2 2022 14:27:07 </td></tr>
<tr><td class="e">Server API </td><td class="v">FPM/FastCGI </td></tr>
<tr><td class="e">Virtual Directory Support </td><td class="v">disabled </td></tr>
<tr><td class="e">Configuration File (php.ini) Path </td><td class="v">/etc/php/7.4/fpm </td></tr>
<tr><td class="e">Loaded Configuration File </td><td class="v">/etc/php/7.4/fpm/php.ini </td></tr>
<tr><td class="e">PHP API </td><td class="v">20190902 </td></tr>
<tr><td class="e">PHP Extension </td><td class="v">20190902 </td></tr>
<tr><td class="e">Zend Extension </td><td class="v">320190902 </td></tr>
<tr><td class="e">Debug Build </td><td class="v">no </td></tr>
<tr><td class="e">Thread Safety </td><td class="v">disabled </td></tr>
<tr><td class="e">Zend Memory Manager </td><td class="v">enabled </td></tr>
<tr><td class="e">IPv6 Support </td><td class="v">enabled </td></tr>
<tr><td class="e">Registered PHP Streams </td><td class="v">https, ftps, compress.zlib, php, file, glob, data, http, ftp, phar </td></tr>
</table>
<hr />
<h2><a name="module_Core">Core</a></h2>
<table>
<tr class="h"><th>Directive</th><th>Local Value</th><th>Master Value</th></tr>
<tr><td class="e">allow_url_fopen</td><td class="v">On</td><td class="v">On</td></tr>
<tr><td class="e">allow_url_include</td><td class="v">Off</td><td class="v">Off</td></tr>
<tr><td class="e">disable_functions</td><td class="v"><i>no value</i></td><td class="v"><i>no value</i></td></tr>
<tr><td class="e">display_errors</td><td class="v">On</td><td class="v">On</td></tr>
<tr><td class="e">memory_limit</td><td class="v">256M</td><td class="v">256M</td></tr>
<tr><td class="e">open_basedir</td><td class="v"><i>no value</i></td><td class="v"><i>no value</i></td></tr>
<tr><td class="e">post_max_size</td><td class="v">32M</td><td class="v">32M</td></tr>
<tr><td class="e">upload_max_filesize</td><td class="v">32M</td><td class="v">32M</td></tr>
<tr><td class="e">max_execution_time</td><td class="v">30</td><td class="v">30</td></tr>
</table>
<hr />
<h2><a name="module_PHP Variables">PHP Variables</a></h2>
<table>
<tr class="h"><th>Variable</th><th>Value</th></tr>
<tr><td class="e">_SERVER["SERVER_SOFTWARE"]</td><td class="v">nginx/1.18.0</td></tr>
<tr><td class="e">_SERVER["SERVER_NAME"]</td><td class="v">app.example.invalid</td></tr>
<tr><td class="e">_SERVER["DOCUMENT_ROOT"]</td><td class="v">/var/www/html</td></tr>
<tr><td class="e">_SERVER["SCRIPT_NAME"]</td><td class="v">/phpinfo.php</td></tr>
<tr><td class="e">_SERVER["DB_PASSWORD"]</td><td class="v">REDACTED_FOR_HONEYPOT</td></tr>
<tr><td class="e">_SERVER["AWS_ACCESS_KEY_ID"]</td><td class="v">EXAMPLE_AKIA1234567890ABCDEF</td></tr>
</table>
</div></body></html>
`;

export const phpinfo: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=UTF-8' },
  });
};
