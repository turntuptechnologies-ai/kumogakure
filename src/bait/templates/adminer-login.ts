import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for Adminer (the single-file DB admin tool by Jakub Vrána).
// One of the most-sprayed DB panels alongside phpMyAdmin, with an active
// CVE history (e.g. CVE-2021-21311 SSRF, the server-side request / file
// read families). Scanners fingerprint it by the `Login - Adminer` title,
// the version string, and the `auth[...]` field names, then credential-stuff
// the form. We serve a faithful login page (those exact field names so the
// fingerprint matches) and render the "Invalid credentials." state on POST.
// Static; the request is never reflected; no canary.

const css = `body{font-family:Verdana,sans-serif;margin:0;background:#fff;color:#000;}
#content{margin:1em 1em 0 17em;}
#menu{position:absolute;top:0;left:0;width:15em;padding:0 0 0 1em;}
h1{font-size:150%;margin:0 0 .3em;border-bottom:1px solid #999;}
h1 a.version{font-size:67%;color:#777;}
table{border-collapse:collapse;}
th{text-align:right;padding:.2em .5em;font-weight:normal;}
input{font:inherit;}
input[type=submit]{border:1px solid #999;background:#eee;padding:.2em .6em;cursor:pointer;}
.error{background:#fdd;border:1px solid #d99;padding:.5em;margin:.5em 0;}
`;

const headHtml = `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Login - Adminer</title>
<style>${css}</style>
</head>
<body class="ltr nojs">
<div id="content">
<h1><a href="https://www.adminer.org/" target="_blank" rel="noreferrer noopener" id="h1">Adminer</a> <a class="version" href="https://www.adminer.org/#download">4.8.1</a></h1>`;

const formHtml = `<form action="" method="post">
<table cellspacing="0" class="layout">
<tr><th>System<td><select name="auth[driver]"><option value="server">MySQL</option><option value="sqlite">SQLite 3</option><option value="pgsql">PostgreSQL</option><option value="oracle">Oracle (beta)</option><option value="mssql">MS SQL (beta)</option></select>
<tr><th>Server<td><input name="auth[server]" value="localhost" autocapitalize="off">
<tr><th>Username<td><input name="auth[username]" id="username" value="" autocomplete="username" autocapitalize="off">
<tr><th>Password<td><input type="password" name="auth[password]" autocomplete="current-password">
<tr><th>Database<td><input name="auth[db]" value="" autocomplete="off" autocapitalize="off">
</table>
<p><input type="submit" value="Login">
<label><input type="checkbox" name="auth[permanent]" value="1"> Permanent login</label>
</form>
</div>
</body>
</html>`;

const errorBlock = `<div class="error">Invalid credentials.</div>`;

export const adminerLogin: TemplateFn = ({ request }) => {
  const error = request.method === 'POST' ? errorBlock : '';
  const html = `${headHtml}${error}${formHtml}`;
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
};
