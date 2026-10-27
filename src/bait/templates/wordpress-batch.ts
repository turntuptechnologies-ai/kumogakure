import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for the WordPress REST batch route `wp-json/batch/v1`, the
// unauthenticated entry point of the wp2shell pre-auth RCE chain
// (CVE-2026-63030 batch route confusion → CVE-2026-60137 `author__not_in`
// SQLi; GHSA-ff9f-jf42-662q / GHSA-fpp7-x2x2-2mjf; WordPress 6.9.0–6.9.4,
// 7.0.0–7.0.1). Answers the way the core route does so the exploit's
// follow-up stages arrive and their bodies are captured:
// - only POST is registered (WordPress honours `_method` and
//   `X-HTTP-Method-Override`); anything else is `rest_no_route`;
// - a body without `requests` is `rest_missing_callback_param` (400);
// - otherwise 207 Multi-Status with one entry per sub-request (capped at
//   WordPress's 25-request limit), each refused the way an unauthenticated
//   caller is. Nothing from the request is reflected and nothing executes.

const MAX_REQUESTS = 25;

function json(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
  });
}

function restError(code: string, message: string, status: number) {
  return { code, message, data: { status } };
}

function effectiveMethod(request: Request): string {
  const url = new URL(request.url);
  const override = url.searchParams.get('_method') ?? request.headers.get('X-HTTP-Method-Override');
  return (override ?? request.method).toUpperCase();
}

function subResponse(item: unknown) {
  const path =
    typeof item === 'object' &&
    item !== null &&
    typeof (item as { path?: unknown }).path === 'string'
      ? (item as { path: string }).path
      : '';
  const body = /^\/wp\/v2\//.test(path)
    ? restError('rest_forbidden', 'Sorry, you are not allowed to do that.', 401)
    : restError('rest_no_route', 'No route was found matching the URL and request method.', 404);
  return { body, status: body.data.status, headers: {} };
}

export const wordpressBatch: TemplateFn = (ctx) => {
  if (effectiveMethod(ctx.request) !== 'POST') {
    return json(
      restError('rest_no_route', 'No route was found matching the URL and request method.', 404),
      404,
    );
  }

  let requests: unknown;
  try {
    requests = (JSON.parse(ctx.body ?? '') as { requests?: unknown }).requests;
  } catch {
    requests = undefined;
  }
  if (!Array.isArray(requests)) {
    return json(
      {
        ...restError('rest_missing_callback_param', 'Missing parameter(s): requests', 400),
        data: { status: 400, params: ['requests'] },
      },
      400,
    );
  }

  return json({ responses: requests.slice(0, MAX_REQUESTS).map(subResponse) }, 207);
};
