import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for Laravel Telescope's debug dashboard at
// `/telescope/<entry>`. Not a single product CVE; the vulnerability is
// the misconfiguration of `TelescopeServiceProvider::gate()` such that
// the dashboard is reachable in production without auth, leaking every
// request / query / mail / cache hit (CWE-285 + CWE-200 — Laravel's
// own docs warn about this). We render the Vue SPA shell that the
// official package emits, with a placeholder app name and the standard
// asset URLs `/vendor/telescope/*` (those paths are the package's
// asset publishing convention, not org attribution). No real telemetry.

const body = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="csrf-token" content="REDACTED_FOR_HONEYPOT">
<title>Telescope</title>
<link rel="stylesheet" href="/vendor/telescope/app.css">
<style>
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#f8fafc;}
.telescope-loading{padding:60px;text-align:center;color:#718096;font-size:14px;}
</style>
</head>
<body>
<div id="telescope">
<div class="telescope-loading">Loading Telescope...</div>
</div>
<script>
window.Telescope = { path: "telescope", timezone: "UTC", recording: true };
</script>
<script src="/vendor/telescope/app.js"></script>
</body>
</html>`;

export const laravelTelescope: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=UTF-8' },
  });
};
