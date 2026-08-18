import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for generic app-metadata endpoints: `/version`, `/about`,
// `/server`. Observed as a single-burst sweep (near-identical timestamps
// across many sources) — a generic recon tool's "what's running here"
// probe rather than a product-specific fingerprint, so one shared decoy
// covers all three, branching only on which of the three was requested to
// keep each response shaped like what its name implies. No secrets in any
// of the three; this is a build/runtime metadata disclosure class only.

const versionBody = JSON.stringify({ version: '2.3.1' });

const aboutBody = JSON.stringify({
  name: 'api',
  description: 'Internal service API',
  version: '2.3.1',
});

const serverBody = JSON.stringify({
  server: 'api-01',
  environment: 'production',
  uptime: 128473,
});

export const fakeAppInfo: TemplateFn = (ctx) => {
  const body =
    ctx.path === '/about' ? aboutBody : ctx.path === '/server' ? serverBody : versionBody;
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
  });
};
