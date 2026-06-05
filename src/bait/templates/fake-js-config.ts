import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for the front-end runtime-config / env JavaScript files
// that SPAs (React / Vue / Angular) ship — `config.js`, `env.js` and
// per-environment variants (`env.dev.js`, `env.production.js`, …) at the
// web root or under `js/`, `static/`, `api/`, `public/`, `src/`, `web/`.
// These routinely embed backend URLs and API keys in cleartext, so
// scanners sweep the well-known names (and `..;/`-traversal forms that
// bypass Tomcat/Spring path normalisation to escape to parent dirs)
// looking for harvestable secrets (CWE-200 / CWE-615).
//
// We return a plausible runtime-config object with non-actionable decoy
// values (`.invalid` hosts, EXAMPLE_/REDACTED placeholders — same
// convention as the fake-env decoy) so the scanner records a hit and
// banks the "secrets" we want to capture follow-on use of. Fully static;
// the request is never reflected.

const body = `// Runtime configuration
window.__APP_CONFIG__ = {
  env: "production",
  apiBaseUrl: "https://api.example.invalid",
  cdnUrl: "https://cdn.example.invalid",
  apiKey: "EXAMPLE_API_KEY_0000000000000000",
  firebase: {
    apiKey: "EXAMPLE_FIREBASE_API_KEY_0000",
    authDomain: "example.firebaseapp.invalid",
    projectId: "example-honeypot"
  },
  sentryDsn: "https://0000000000000000@sentry.example.invalid/0",
  authToken: "REDACTED_FOR_HONEYPOT",
  features: { signup: true, beta: false }
};
`;

export const fakeJsConfig: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=UTF-8',
      'Cache-Control': 'no-store',
    },
  });
};
