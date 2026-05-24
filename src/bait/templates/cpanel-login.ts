import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for cPanel login probes via the `/___proxy_subdomain_cpanel`
// service-subdomain proxy convention (also reachable through bare
// `/cpanel` etc., but scanners now favour the proxy form). cPanel has
// an active CVE history (e.g. CVE-2023-29489, CVE-2024-... XSS / auth
// bypass families) and the login surface is the standard fingerprint /
// credential-stuffing target. We render a cPanel-shaped login form
// that posts to `/login` (cPanel's actual endpoint). No real session,
// no canary headers.

const css = `body{background:#3b97d3;font-family:-apple-system,Segoe UI,Roboto,sans-serif;margin:0;color:#333;}
.login-card{max-width:380px;margin:6% auto;background:#fff;border-radius:6px;padding:36px 32px;box-shadow:0 2px 8px rgba(0,0,0,0.15);}
.logo{font-size:26px;font-weight:300;color:#3b97d3;text-align:center;margin-bottom:18px;letter-spacing:1px;}
.field{margin-bottom:14px;}
.field label{display:block;font-size:12px;color:#666;margin-bottom:4px;}
.field input{width:100%;padding:9px 12px;font-size:14px;border:1px solid #ccc;border-radius:3px;box-sizing:border-box;}
.submit{width:100%;padding:10px;background:#3b97d3;color:#fff;border:0;border-radius:3px;font-size:14px;cursor:pointer;}
.error{background:#fce8e8;color:#a02020;padding:8px 12px;border-radius:3px;font-size:13px;margin-bottom:14px;}
`;

const headHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>cPanel Login</title>
<style>${css}</style>
</head>
<body>
<div class="login-card">
<div class="logo">cPanel</div>`;

const formHtml = `<form action="/login" method="post" name="login_form">
<div class="field">
<label for="user">Username</label>
<input type="text" id="user" name="user" autocomplete="username">
</div>
<div class="field">
<label for="pass">Password</label>
<input type="password" id="pass" name="pass" autocomplete="current-password">
</div>
<input type="hidden" name="goto_uri" value="/">
<button type="submit" class="submit">Log in</button>
</form>
</div>
</body>
</html>`;

const errorBlock = `<div class="error">The login is invalid.</div>`;

export const cpanelLogin: TemplateFn = ({ request }) => {
  const error = request.method === 'POST' ? errorBlock : '';
  const html = `${headHtml}${error}${formHtml}`;
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    },
  });
};
