import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for the front-end / app runtime-config JSON files that SPAs
// and services ship — `config.json`, `config.<env>.json`, `configuration.json`,
// `settings.json`, `production.json`, … at the root or under `assets/`,
// `static/`, etc. Scanners sweep the well-known names looking for backend
// URLs and API keys left in cleartext (CWE-200 / CWE-615) — the JSON sibling
// of the `config.js` / `env.js` sweep the fake-js-config decoy covers. We
// return a plausible runtime config: backend URLs and a fabricated,
// non-functional key, no real secret. Fully static; never reflects input.

const body = JSON.stringify(
  {
    env: 'production',
    apiBaseUrl: 'https://api.example.invalid',
    wsUrl: 'wss://ws.example.invalid',
    cdnUrl: 'https://cdn.example.invalid',
    apiKey: '6b1e9f4c8a2d7e0351f9c6b4a8d2e1f0',
    sentryDsn: 'https://0f1e2d3c4b5a69788896a7b5c3d1e0f2@sentry.example.invalid/42',
    features: { signup: true, beta: false, maintenance: false },
    version: '2.8.1',
  },
  null,
  2,
);

export const fakeJsonConfig: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'Cache-Control': 'no-store',
    },
  });
};
