import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for the Symfony Web Profiler exposed in production via a
// shipped dev front controller (`app_dev.php`) and the `/_profiler`
// namespace. Not a single product CVE: the vulnerability is the
// misconfiguration of leaving `app_dev.php` / `APP_ENV=dev` reachable,
// which exposes the profiler — every request's headers, session, config
// parameters, env vars, and DB queries (CWE-200 + CWE-489, called out in
// Symfony's own "never deploy app_dev.php" guidance). `/_profiler/open`
// additionally renders source files by path and has been leveraged for
// local file read on misconfigured installs.
//
// Scanners spray the path under several prefixes (`/_profiler`,
// `/app_dev.php/_profiler`, `/web/app_dev.php/_profiler/open`, …); the
// router matches the family. We render the profiler's search-home shell
// — Symfony-branded so the fingerprint lands — with a fabricated recent-
// requests list so the scanner sees a live dev profiler and follows up.
// No real telemetry, and the attacker-supplied `?file=` of the `open`
// action is never read or reflected (routing is path-only).

const body = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex,nofollow">
<title>Symfony Profiler</title>
<link rel="icon" type="image/png" href="/_profiler/favicon.png">
<style>
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:#f5f5f5;color:#222;}
.sf-profiler-header{background:#2d2d2d;color:#fff;padding:14px 24px;display:flex;align-items:center;}
.sf-profiler-header .logo{font-weight:700;font-size:17px;letter-spacing:.5px;}
.sf-profiler-header .version{margin-left:14px;font-size:12px;color:#aaa;}
.sf-search{padding:18px 24px;background:#fff;border-bottom:1px solid #e0e0e0;}
.sf-search input{padding:6px 10px;border:1px solid #ccc;border-radius:3px;font-size:13px;}
table{width:100%;border-collapse:collapse;background:#fff;}
th,td{text-align:left;padding:9px 24px;font-size:13px;border-bottom:1px solid #eee;}
th{background:#fafafa;color:#666;font-weight:600;}
.status-2{color:#4f805d;}.status-3{color:#a07b1d;}.status-5{color:#b0413e;}
a{color:#5b88bd;text-decoration:none;}
</style>
</head>
<body>
<div class="sf-profiler-header">
<span class="logo">Symfony</span>
<span class="version">Profiler — v3.4.49 — env <b>dev</b></span>
</div>
<form class="sf-search" action="/_profiler/search" method="get">
<input type="text" name="ip" placeholder="IP" size="10">
<input type="text" name="url" placeholder="URL" size="24">
<input type="submit" value="Search">
</form>
<table>
<thead><tr><th>Token</th><th>IP</th><th>Method</th><th>URL</th><th>Status</th><th>Time</th></tr></thead>
<tbody>
<tr><td><a href="/_profiler/a3f9c1">a3f9c1</a></td><td>127.0.0.1</td><td>GET</td><td>/</td><td class="status-2">200</td><td>11:42:08</td></tr>
<tr><td><a href="/_profiler/b71e0d">b71e0d</a></td><td>127.0.0.1</td><td>POST</td><td>/login</td><td class="status-3">302</td><td>11:41:55</td></tr>
<tr><td><a href="/_profiler/c2880a">c2880a</a></td><td>127.0.0.1</td><td>GET</td><td>/api/health</td><td class="status-2">200</td><td>11:40:12</td></tr>
</tbody>
</table>
</body>
</html>`;

export const symfonyProfiler: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
      'Cache-Control': 'no-store, private',
      'X-Debug-Token': 'a3f9c1',
    },
  });
};
