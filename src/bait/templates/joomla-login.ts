import type { TemplateFn } from '../../types.js';

const css = `body{background:#f4f4f4;font-family:Helvetica,Arial,sans-serif;margin:0;}
.login-container{max-width:360px;margin:8% auto;background:#fff;padding:30px;border-radius:4px;box-shadow:0 2px 4px rgba(0,0,0,.08);}
.login-container h1{margin:0 0 20px;font-size:22px;font-weight:400;color:#333;text-align:center;}
.login-container label{display:block;margin:14px 0 6px;color:#444;font-size:14px;}
.login-container input[type=text],.login-container input[type=password]{width:100%;padding:8px 10px;font-size:14px;border:1px solid #ccc;border-radius:3px;box-sizing:border-box;}
.login-container .btn-primary{width:100%;margin-top:16px;padding:10px;background:#2a64a4;color:#fff;border:0;border-radius:3px;font-size:14px;cursor:pointer;}
.alert{background:#fdecea;border:1px solid #e6b1b1;color:#a4292e;padding:10px;border-radius:3px;margin-bottom:14px;font-size:13px;}
`;

const headHtml = `<!DOCTYPE html>
<html lang="en-gb">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Administration - Log in</title>
<style>${css}</style>
</head>
<body>
<div class="login-container">
<h1>Administration</h1>`;

const formHtml = `<form action="/administrator/index.php" method="post" id="form-login" name="form-login">
<label for="mod-login-username">Username</label>
<input type="text" id="mod-login-username" name="username" autocomplete="username" autofocus>
<label for="mod-login-password">Password</label>
<input type="password" id="mod-login-password" name="passwd" autocomplete="current-password">
<button type="submit" class="btn-primary">Log in</button>
<input type="hidden" name="option" value="com_login">
<input type="hidden" name="task" value="login">
<input type="hidden" name="return" value="aW5kZXgucGhw">
</form>
</div>
</body>
</html>`;

const errorAlert = `<div class="alert">Username and password do not match or you do not have an account yet.</div>`;

export const joomlaLogin: TemplateFn = ({ request }) => {
  const alert = request.method === 'POST' ? errorAlert : '';
  const html = `${headHtml}${alert}${formHtml}`;
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    },
  });
};
