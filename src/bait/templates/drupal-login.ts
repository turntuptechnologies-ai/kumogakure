import type { TemplateFn } from '../../types.js';

const css = `body{background:#fff;font-family:Verdana,sans-serif;color:#000;margin:0;}
.page-wrapper{max-width:480px;margin:6% auto;padding:20px;}
.user-login-form{background:#fff;padding:20px;border:1px solid #ddd;border-radius:3px;}
.user-login-form h1{font-size:22px;margin:0 0 16px;color:#333;}
.form-item{margin-bottom:14px;}
.form-item label{display:block;margin-bottom:4px;font-weight:bold;font-size:14px;}
.form-item input[type=text],.form-item input[type=password]{width:100%;padding:6px 8px;font-size:14px;border:1px solid #aaa;box-sizing:border-box;}
.button{background:#0074bd;color:#fff;padding:8px 18px;border:0;cursor:pointer;font-size:14px;border-radius:3px;}
.messages--error{background:#f9edbe;border-top:1px solid #f0c000;border-bottom:1px solid #f0c000;color:#4d2c00;padding:10px;margin-bottom:14px;font-size:13px;}
.description{font-size:12px;color:#555;margin-top:4px;}
`;

const headHtml = `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Log in</title>
<style>${css}</style>
</head>
<body class="user-login">
<div class="page-wrapper">`;

const formStartHtml = `<form class="user-login-form" action="/user/login" method="post" id="user-login-form" accept-charset="UTF-8">
<h1>Log in</h1>`;

const formEndHtml = `<div class="form-item">
<label for="edit-name">Username</label>
<input type="text" id="edit-name" name="name" size="60" maxlength="60" class="form-text required" autocomplete="username">
<div class="description">Enter your username.</div>
</div>
<div class="form-item">
<label for="edit-pass">Password</label>
<input type="password" id="edit-pass" name="pass" size="60" maxlength="128" class="form-text required" autocomplete="current-password">
<div class="description">Enter the password that accompanies your username.</div>
</div>
<div class="form-actions">
<input type="submit" id="edit-submit" name="op" value="Log in" class="button button--primary form-submit">
</div>
<input type="hidden" name="form_id" value="user_login_form">
</form>
</div>
</body>
</html>`;

const errorMessage = `<div class="messages messages--error">Unrecognized username or password. <a href="/user/password">Forgot your password?</a></div>`;

export const drupalLogin: TemplateFn = ({ request }) => {
  const error = request.method === 'POST' ? errorMessage : '';
  const html = `${headHtml}${formStartHtml}${error}${formEndHtml}`;
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    },
  });
};
