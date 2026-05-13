import type { TemplateFn } from '../../types.js';

const css = `body{background:#f5f5f5;font-family:Arial,sans-serif;margin:0;}
.login-box{max-width:340px;margin:5% auto;background:#fff;padding:30px;border-radius:4px;box-shadow:0 2px 4px rgba(0,0,0,.1);}
.login-box h1{margin:0 0 20px;font-size:20px;color:#333;text-align:center;}
.field{margin-bottom:14px;}
.field label{display:block;margin-bottom:6px;color:#555;font-size:13px;}
.field input{width:100%;padding:8px 10px;font-size:14px;border:1px solid #ccc;border-radius:3px;box-sizing:border-box;}
.btn{width:100%;padding:10px;background:#0066cc;color:#fff;border:0;border-radius:3px;font-size:14px;cursor:pointer;}
.error{background:#fdecea;border:1px solid #e6b1b1;color:#a4292e;padding:8px 10px;border-radius:3px;margin-bottom:12px;font-size:13px;}
`;

const headHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Login</title>
<style>${css}</style>
</head>
<body>
<div class="login-box">
<h1>VPN Gateway</h1>`;

const formHtml = `<form action="/cgi/login" method="post" name="vpnForm">
<div class="field">
<label for="login">User name</label>
<input type="text" id="login" name="login" autocomplete="username">
</div>
<div class="field">
<label for="passwd">Password</label>
<input type="password" id="passwd" name="passwd" autocomplete="current-password">
</div>
<button type="submit" class="btn">Log On</button>
</form>
</div>
</body>
</html>`;

const errorBlock = `<div class="error">Incorrect user name or password.</div>`;

export const citrixVpn: TemplateFn = ({ request }) => {
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
