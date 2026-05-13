import type { TemplateFn } from '../../types.js';

const headHtml = `<!DOCTYPE html>
<html><head>
<title>Apache Status</title>
</head><body>
<h1>Apache Server Status for example.invalid (via 127.0.0.1)</h1>
<dl>
<dt>Server Version: Apache/2.4.41 (Ubuntu)</dt>
<dt>Server MPM: event</dt>
<dt>Server Built: 2024-01-01T00:00:00</dt>
</dl><hr/>
<dl>`;

const tailHtml = `<dt>Parent Server Config. Generation: 1</dt>
<dt>Parent Server MPM Generation: 0</dt>
<dt>Server load: 0.10 0.05 0.01</dt>
<dt>Total accesses: 12345 - Total Traffic: 12.3 MB</dt>
<dt>CPU Usage: u0.10 s0.05 cu0 cs0 - .25% CPU load</dt>
<dt>1 requests/sec - 1.2 kB/second - 1 kB/request</dt>
</dl>
<pre>__W___________........................................................
......................................................................
</pre>
<hr/>
<table border="0"><tr><th>Srv</th><th>PID</th><th>Acc</th><th>M</th><th>SS</th><th>Req</th><th>Conn</th><th>Child</th><th>Slot</th><th>Client</th><th>Protocol</th><th>VHost</th><th>Request</th></tr>
</table>
</body></html>
`;

export const fakeServerStatus: TemplateFn = () => {
  const now = new Date();
  const isoNow = now.toISOString();
  const uptimeSeconds = 3600 * 24 * 7;
  const body =
    `${headHtml}<dt>Current Time: ${isoNow}</dt>\n` +
    `<dt>Restart Time: ${new Date(now.getTime() - uptimeSeconds * 1000).toISOString()}</dt>\n` +
    `<dt>Server uptime: 7 days 0 hours 0 minutes 0 seconds</dt>\n` +
    tailHtml;
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=UTF-8' },
  });
};
