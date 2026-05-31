import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for Atlassian Confluence's AUI Velocity templates under
// `/template/aui/*.vm` — the unauthenticated OGNL-injection sink of
// CVE-2021-26084 (Confluence Server / Data Center). A scanner POSTs a
// crafted `queryString` (e.g. `aaa'%2b#{233*157}%2b'`) that a
// vulnerable server evaluates as OGNL and reflects, which is also the
// pre-auth RCE primitive. `text-inline.vm` is the most heavily sprayed
// template; sibling AUI templates share the same sink, so the router
// matches the whole `/template/aui/<name>.vm` family.
//
// We render a plausible AUI inline-edit fragment (the genuine output
// shape of these templates) so the scanner records a Confluence hit and
// proceeds to its exploit payload, which we capture. Crucially the
// attacker-supplied `queryString` is NEVER evaluated or reflected into
// the response — the body is a static constant, so there is no OGNL
// execution and no reflected-content / XSS surface. The math/RCE probe
// simply does not "pass", exactly as a patched or WAF-fronted Confluence
// behaves, while the request is still logged.

const body = `<div class="aui-inline-edit aui-inline-edit-tooltip">
<div class="aui-inline-edit-content" tabindex="0">
<span class="aui-inline-edit-static"></span>
</div>
<form class="aui-inline-edit-fields" action="/template/aui/text-inline.vm" method="post">
<input type="text" class="text aui-inline-edit-field" name="queryString" value="" autocomplete="off">
<button type="submit" class="aui-button aui-button-light aui-inline-edit-save">Save</button>
</form>
</div>`;

export const confluenceTextInline: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
      'Cache-Control': 'no-store',
    },
  });
};
