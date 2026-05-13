import type { TemplateFn } from '../../types.js';

const css = `body{background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;}
.login-page{max-width:400px;margin:6% auto;padding:30px;background:#fff;border:1px solid #ddd;border-radius:4px;}
.login-page h1{margin:0 0 18px;font-size:22px;text-align:center;color:#333;}
.tab-active{padding:8px 14px;border-bottom:2px solid #6666c4;color:#333;display:inline-block;margin-bottom:18px;font-size:14px;}
.form-group{margin-bottom:14px;}
.form-group label{display:block;margin-bottom:4px;color:#444;font-size:13px;font-weight:bold;}
.form-control{width:100%;padding:8px 10px;font-size:14px;border:1px solid #ccc;border-radius:3px;box-sizing:border-box;}
.btn-primary{padding:10px 18px;background:#6666c4;color:#fff;border:0;border-radius:3px;font-size:14px;cursor:pointer;}
.flash-error{background:#f8d7da;border:1px solid #f5c6cb;color:#721c24;padding:10px 12px;border-radius:3px;margin-bottom:14px;font-size:13px;}
`;

const headHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Sign in</title>
<style>${css}</style>
</head>
<body>
<div class="login-page">
<h1>Sign in</h1>
<span class="tab-active">Standard</span>`;

const formHtml = `<form action="/users/sign_in" method="post" id="new_user">
<input type="hidden" name="authenticity_token" value="EXAMPLE_TOKEN_NOT_FUNCTIONAL">
<div class="form-group">
<label for="user_login">Username or email</label>
<input type="text" name="user[login]" id="user_login" class="form-control" autocomplete="username">
</div>
<div class="form-group">
<label for="user_password">Password</label>
<input type="password" name="user[password]" id="user_password" class="form-control" autocomplete="current-password">
</div>
<button type="submit" name="commit" value="Sign in" class="btn-primary">Sign in</button>
</form>
</div>
</body>
</html>`;

const errorBlock = `<div class="flash-error">Invalid login or password.</div>`;

export const gitlabSignIn: TemplateFn = ({ request }) => {
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
