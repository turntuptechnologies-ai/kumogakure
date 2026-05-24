import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for the Apache Struts `/login.action` endpoint that
// scanners use both for fingerprinting and as the trigger surface for
// the OGNL CVE family:
//   - CVE-2017-5638  (S2-045 / S2-046, multipart Content-Type OGNL — the Equifax CVE)
//   - CVE-2017-9805  (S2-052, REST plugin XStream deserialization)
//   - CVE-2018-11776 (S2-057, namespace/action URL OGNL)
//   - CVE-2023-50164 (file-upload path traversal)
// We return a Struts-flavoured login form (action="login.action",
// `s:` namespace look-alike) so the scanner records a positive hit
// and then tries its exploit payload, which we capture.

const body = `<!DOCTYPE html>
<html>
<head>
<title>Login</title>
<style>
body{font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:40px;}
.login-box{max-width:360px;margin:0 auto;background:#fff;padding:32px;border:1px solid #ddd;}
.login-box h2{margin:0 0 18px;font-weight:normal;color:#333;}
.form-row{margin-bottom:12px;}
.form-row label{display:block;font-size:12px;color:#666;margin-bottom:4px;}
.form-row input{width:100%;padding:8px;border:1px solid #ccc;box-sizing:border-box;}
.submit{padding:8px 20px;background:#0066cc;color:#fff;border:0;cursor:pointer;}
.errors{color:#a00;font-size:13px;margin-bottom:10px;}
</style>
</head>
<body>
<div class="login-box">
<h2>Sign in</h2>
<form action="login.action" method="post" name="loginForm">
<div class="form-row">
<label for="username">User name</label>
<input type="text" id="username" name="username" autocomplete="username">
</div>
<div class="form-row">
<label for="password">Password</label>
<input type="password" id="password" name="password" autocomplete="current-password">
</div>
<input type="hidden" name="struts.token.name" value="struts.token">
<input type="hidden" name="struts.token" value="REDACTED_FOR_HONEYPOT">
<button type="submit" class="submit">Sign in</button>
</form>
</div>
</body>
</html>`;

export const strutsLoginAction: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
      'Cache-Control': 'no-store',
    },
  });
};
