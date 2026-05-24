import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for Yii2 Debug Toolbar's request-log viewer at
// `/debug/default/view`. Not a single product CVE; the surface is
// `yii\debug\Module` reachable from non-allowed IPs in production
// (CWE-200 + CWE-285 — Yii2's own docs flag misconfigured `allowedIPs`).
// Scanners hit this path to capture request bodies, env dumps, and
// SQL — i.e. anything the framework logs. We render a minimal but
// plausible debug-viewer shell with an invented Yii version, no
// real request rows, and a placeholder app name. Asset URLs follow
// the `/index.php?r=debug/...` convention the toolbar emits.

const body = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Yii Debugger</title>
<style>
body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#fff;color:#333;margin:0;}
.yii-debug-toolbar{background:#f5f5f5;border-bottom:1px solid #ddd;padding:6px 12px;font-size:12px;}
.yii-debug-toolbar .label{background:#0078d4;color:#fff;padding:2px 6px;border-radius:2px;margin-right:8px;}
.content{padding:18px;}
.content h1{font-size:22px;font-weight:400;margin:0 0 14px;}
table{border-collapse:collapse;width:100%;font-size:13px;}
th,td{padding:6px 10px;border-bottom:1px solid #eee;text-align:left;}
th{background:#fafafa;}
.status-200{color:#28a745;}
.status-404{color:#dc3545;}
</style>
</head>
<body>
<div class="yii-debug-toolbar">
  <span class="label">Yii Debugger</span>
  <span>Application: <b>example-app</b></span>
  &nbsp;|&nbsp;
  <span>Yii Version: <b>2.0.49</b></span>
  &nbsp;|&nbsp;
  <span>Environment: <b>prod</b></span>
</div>
<div class="content">
<h1>Available Debug Data</h1>
<table>
<tr><th>Tag</th><th>Time</th><th>IP</th><th>Session ID</th><th>Status</th><th>Method</th><th>URL</th></tr>
<tr><td colspan="7"><i>No request data available.</i></td></tr>
</table>
</div>
</body>
</html>`;

export const yii2Debug: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=UTF-8' },
  });
};
