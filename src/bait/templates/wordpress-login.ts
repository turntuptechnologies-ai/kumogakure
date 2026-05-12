import type { TemplateFn } from '../../types.js';

const css = `body{background:#f0f0f1;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}
.login{padding:8% 0 0;margin:auto;}
#login{width:320px;margin:7% auto 0;padding:8% 0 0;}
.login form{background:#fff;padding:26px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.13);}
.login label{display:block;margin-bottom:6px;color:#1d2327;font-size:14px;}
.login input[type=text],.login input[type=password]{width:100%;padding:6px 8px;font-size:24px;line-height:1.33333333;box-sizing:border-box;border:1px solid #8c8f94;}
.login .submit{padding:24px 0 0;}
.login .button-primary{background:#2271b1;border-color:#2271b1;color:#fff;text-decoration:none;text-shadow:none;padding:0 12px;min-height:32px;font-size:13px;line-height:2.15384615;cursor:pointer;border-width:1px;border-style:solid;border-radius:3px;}
.login .notice{padding:12px;margin:0 0 16px;background:#fff;border-left:4px solid #d63638;box-shadow:0 1px 1px rgba(0,0,0,.04);}
`;

const headHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Log In</title>
<style>${css}</style>
</head>
<body class="login no-js login-action-login wp-core-ui">
<div id="login">
<h1><a href="#">Log In</a></h1>`;

const formHtml = `<form name="loginform" id="loginform" action="/wp-login.php" method="post">
<p><label for="user_login">Username or Email Address</label>
<input type="text" name="log" id="user_login" class="input" value="" size="20" autocapitalize="off" autocomplete="username"></p>
<div class="user-pass-wrap">
<label for="user_pass">Password</label>
<div class="wp-pwd"><input type="password" name="pwd" id="user_pass" class="input password-input" value="" size="20" autocomplete="current-password" spellcheck="false"></div>
</div>
<p class="forgetmenot"><label for="rememberme"><input name="rememberme" type="checkbox" id="rememberme" value="forever"> Remember Me</label></p>
<p class="submit">
<input type="submit" name="wp-submit" id="wp-submit" class="button button-primary button-large" value="Log In">
<input type="hidden" name="redirect_to" value="/wp-admin/">
<input type="hidden" name="testcookie" value="1">
</p>
</form>
<p id="nav"><a href="/wp-login.php?action=lostpassword">Lost your password?</a></p>
</div>
</body>
</html>`;

const errorNotice = `<div id="login_error" class="notice notice-error"><strong>Error:</strong> The password you entered for the username is incorrect. <a href="/wp-login.php?action=lostpassword">Lost your password?</a></div>`;

export const wordpressLogin: TemplateFn = ({ request }) => {
  const notice = request.method === 'POST' ? errorNotice : '';
  const html = `${headHtml}${notice}${formHtml}`;
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    },
  });
};
