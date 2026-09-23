import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for "run a command over HTTP" endpoints — `/api/exec`,
// `/api/run`, `/api/command`, `/admin/exec`, … Swept by a single
// distributed tool (dozens of sources, near-identical timestamps) hunting
// for unauthenticated command-execution APIs left exposed by dev / agent
// tooling and admin panels (CWE-78 / CWE-306 by design, not a product CVE).
//
// The bare GET gets the validation error such an endpoint gives when the
// command field is missing, which is the cheapest answer that invites the
// follow-up request carrying the actual command — the part worth capturing.
// Nothing is ever executed and the request is never reflected; the body is
// fully static.

const body = JSON.stringify({
  status: 'error',
  error: 'Bad Request',
  message: 'missing required field: command',
});

export const execApi: TemplateFn = () => {
  return new Response(body, {
    status: 400,
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'Cache-Control': 'no-store',
    },
  });
};
