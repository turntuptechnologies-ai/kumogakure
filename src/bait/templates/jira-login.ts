import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for Atlassian Jira's authenticated dashboard entry point
// `/secure/Dashboard.jspa`. Anonymous access bounces to the Jira login
// gadget, so this is primarily a high-signal product/version fingerprint
// — scanners confirm Jira is present, then target the Jira CVE surface
// (CVE-2019-11581 SSTI, CVE-2020-14179 Dashboard info disclosure,
// CVE-2022-0540 auth bypass, …). The same `/login.jsp` is where this
// page's form posts, so it is served by the same decoy (a credential
// stuffer that submits would otherwise dead-end at category=unknown).
//
// We render a Jira-flavoured login screen with the standard
// `os_username` / `os_password` / `atlassian-token` fields and an
// 8.20.0 footer (matching the jira-pom-properties version decoy) so the
// fingerprint lands. No real session, no canary headers; on POST it
// shows Jira's "Sorry, your username and password are incorrect" state.

const css = `body{font-family:Arial,Helvetica,sans-serif;background:#f4f5f7;margin:0;color:#172b4d;}
.aui-header{background:#0747a6;color:#fff;padding:12px 24px;font-size:18px;font-weight:600;}
.login-wrap{max-width:400px;margin:7% auto;background:#fff;border:1px solid #dfe1e6;border-radius:3px;padding:32px;}
.login-wrap h1{font-size:16px;font-weight:600;margin:0 0 20px;color:#5e6c84;}
.field{margin-bottom:14px;}
.field label{display:block;font-size:12px;color:#5e6c84;margin-bottom:4px;}
.field input{width:100%;padding:8px 10px;border:1px solid #dfe1e6;border-radius:3px;box-sizing:border-box;font-size:14px;}
.aui-button{background:#0052cc;color:#fff;border:0;border-radius:3px;padding:8px 18px;font-size:14px;cursor:pointer;}
.aui-message-error{background:#ffebe6;color:#bf2600;padding:8px 12px;border-radius:3px;font-size:13px;margin-bottom:16px;}
.footer{text-align:center;color:#7a869a;font-size:11px;margin-top:24px;}`;

const headHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Log in - Jira</title>
<meta name="application-name" content="JIRA">
<style>${css}</style>
</head>
<body>
<div class="aui-header">Jira</div>
<div class="login-wrap">
<h1>Log in to your account</h1>`;

const formHtml = `<form action="/login.jsp" method="post" name="loginform">
<div class="field">
<label for="login-form-username">Username</label>
<input type="text" id="login-form-username" name="os_username" autocomplete="username">
</div>
<div class="field">
<label for="login-form-password">Password</label>
<input type="password" id="login-form-password" name="os_password" autocomplete="current-password">
</div>
<input type="hidden" name="os_destination" value="/secure/Dashboard.jspa">
<input type="hidden" name="atlassian-token" value="REDACTED_FOR_HONEYPOT">
<button type="submit" class="aui-button" name="login" value="Log In">Log In</button>
</form>
<div class="footer">Atlassian Jira Project Management Software (v8.20.0)</div>
</div>
</body>
</html>`;

const errorBlock = `<div class="aui-message-error">Sorry, your username and password are incorrect - please try again.</div>`;

export const jiraLogin: TemplateFn = ({ request }) => {
  const error = request.method === 'POST' ? errorBlock : '';
  return new Response(`${headHtml}${error}${formHtml}`, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-AUSERNAME': 'anonymous',
    },
  });
};
