import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for ASP.NET `trace.axd`. Not a single CVE; it's the
// classic info-disclosure misconfiguration when `<trace enabled="true"
// localOnly="false" />` is left on in production (CWE-200), and is on
// every web-scanner's enumeration list. The page Microsoft renders is
// a request table followed by per-request detail; we return the empty
// "no requests yet" shape with a placeholder application name. No
// real headers, sessions, or stack frames.

const body = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<title>Application Trace</title>
<style type="text/css">
body { font: 10pt verdana,arial,helvetica; }
.subtitle { font-size: 1.4em; font-weight: bold; padding: 6px 0; }
table { border-collapse: collapse; width: 100%; }
td, th { padding: 4px 8px; border-bottom: 1px solid #999; text-align: left; }
th { background: #ffcc00; }
</style>
</head>
<body>
<h1>Application Trace</h1>
<div class="subtitle">example-app</div>
<p><b>Physical Directory:</b>C:\\inetpub\\wwwroot\\example-app\\</p>

<div class="subtitle">Requests to this Application</div>
<table>
<tr><th>No.</th><th>Time of Request</th><th>File</th><th>Status Code</th><th>Verb</th></tr>
<tr><td colspan="5"><i>No requests are currently captured.</i></td></tr>
</table>
</body>
</html>`;

export const aspnetTrace: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=UTF-8' },
  });
};
