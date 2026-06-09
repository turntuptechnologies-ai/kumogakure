import type { TemplateFn } from '../../types.js';

// Decoy for Next.js (App Router) Server Action invocations. Next.js
// dispatches actions via the `Next-Action` header and replies with a
// React Server Components "flight" stream (Content-Type text/x-component)
// encoding the action's return value. Scanners spray the header to
// fingerprint Next.js and probe action abuse (auth bypass, file-write /
// upload actions, SSRF). We return a minimal well-formed flight stream
// reporting a benign success, so the scanner records "Next.js with a live
// server action" and proceeds — the attempt is captured, never executed.
// Static body; the attacker-supplied action id / payload is never
// reflected. The `Vary` header mirrors what Next.js emits for RSC/action
// responses.

const body = `0:{"a":"$@1","f":"","b":"BBnKp3Qf6m9XtZr0aWvLd"}
1:{"success":true}
`;

export const nextjsServerAction: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/x-component',
      Vary: 'RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Action',
      'Cache-Control': 'no-store, must-revalidate',
    },
  });
};
