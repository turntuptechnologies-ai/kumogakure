import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for WHM (cPanel's server-admin sibling) login probes
// via `/___proxy_subdomain_whm/login`. Same family as the cPanel
// login decoy, but distinct UI (WHM uses a darker, server-admin
// chrome) so scanners that branch on body content see the expected
// shape. Standard cPanel/WHM CVE history applies (auth-bypass and
// XSS families). Posts to `/login` like the real WHM login.

const css = `body{background:#28323b;font-family:-apple-system,Segoe UI,Roboto,sans-serif;margin:0;color:#eee;}
.login-card{max-width:380px;margin:6% auto;background:#1f262e;border:1px solid #3a4651;border-radius:6px;padding:36px 32px;box-shadow:0 4px 14px rgba(0,0,0,0.4);}
.logo{font-size:26px;font-weight:300;color:#f0a020;text-align:center;margin-bottom:6px;letter-spacing:1px;}
.subtitle{text-align:center;color:#9aa4ae;font-size:12px;margin-bottom:18px;}
.field{margin-bottom:14px;}
.field label{display:block;font-size:12px;color:#9aa4ae;margin-bottom:4px;}
.field input{width:100%;padding:9px 12px;font-size:14px;background:#2a333d;border:1px solid #3a4651;border-radius:3px;color:#eee;box-sizing:border-box;}
.submit{width:100%;padding:10px;background:#f0a020;color:#1f262e;border:0;border-radius:3px;font-size:14px;font-weight:600;cursor:pointer;}
.error{background:#5a2828;color:#ffcfcf;padding:8px 12px;border-radius:3px;font-size:13px;margin-bottom:14px;}
`;

const headHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>WHM Login</title>
<style>${css}</style>
</head>
<body>
<div class="login-card">
<div class="logo">WHM</div>
<div class="subtitle">Web Host Manager</div>`;

const formHtml = `<form action="/login" method="post" name="login_form">
<div class="field">
<label for="user">Username</label>
<input type="text" id="user" name="user" autocomplete="username">
</div>
<div class="field">
<label for="pass">Password</label>
<input type="password" id="pass" name="pass" autocomplete="current-password">
</div>
<input type="hidden" name="goto_uri" value="/scripts5/command">
<button type="submit" class="submit">Log in</button>
</form>
</div>
</body>
</html>`;

const errorBlock = `<div class="error">The login is invalid.</div>`;

export const whmLogin: TemplateFn = ({ request }) => {
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
