import type { TemplateFn } from '../../types.js';

const css = `body{background:#f5f5f5;font-family:sans-serif;margin:0;}
#page_content{max-width:320px;margin:8% auto;}
#login_form_box{background:#fff;padding:24px;border:1px solid #dee2e6;border-radius:4px;}
#login_form_box h1{margin-top:0;font-size:24px;font-weight:400;color:#495057;}
.login_form_field{margin-bottom:14px;}
.login_form_field label{display:block;margin-bottom:6px;color:#495057;font-size:13px;}
.login_form_field input[type=text],.login_form_field input[type=password]{width:100%;padding:6px 10px;font-size:14px;border:1px solid #ced4da;border-radius:3px;box-sizing:border-box;}
.input_submit{background:#357abd;color:#fff;padding:8px 16px;border:0;border-radius:3px;cursor:pointer;font-size:14px;}
.error_block{background:#f8d7da;border:1px solid #f5c6cb;color:#721c24;padding:10px 14px;margin-bottom:14px;border-radius:3px;font-size:13px;}
`;

const headHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>phpMyAdmin</title>
<style>${css}</style>
</head>
<body class="login">
<div id="page_content">
<div id="login_form_box">
<h1>phpMyAdmin</h1>`;

const formHtml = `<form method="post" action="/phpmyadmin/index.php" name="login_form" id="login_form" autocomplete="off">
<div class="login_form_field">
<label for="input_username">Username:</label>
<input type="text" name="pma_username" id="input_username" autocomplete="username">
</div>
<div class="login_form_field">
<label for="input_password">Password:</label>
<input type="password" name="pma_password" id="input_password" autocomplete="current-password">
</div>
<input class="input_submit" value="Log in" type="submit" id="input_go">
<input type="hidden" name="server" value="1">
</form>
</div>
</div>
</body>
</html>`;

const errorBlock = `<div class="error_block">Access denied for user (using password: YES).</div>`;

export const phpmyadminLogin: TemplateFn = ({ request }) => {
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
