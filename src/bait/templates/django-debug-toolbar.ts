import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for the Django Debug Toolbar (DjDT) endpoints mounted
// under the `__debug__/` namespace (`render_panel`, `sql_select`,
// `sql_explain`, `template_source`, `history_sidebar`, …). DjDT's own
// docs forbid shipping it with DEBUG=True in production; when that
// misconfiguration happens the toolbar leaks SQL queries, settings,
// and request data, and its `sql_select` / `sql_explain` views have
// historically been an arbitrary-SQL-execution surface. CWE-200
// (information exposure) + CWE-489 (active debug code); no single
// product CVE.
//
// When `render_panel` is called without a valid `store_id` (the bare
// path a scanner hits), real DjDT returns exactly this message with a
// 200. Mirroring it fingerprints DjDT as present while leaking no
// actual debug data.

const body = "Data for this panel isn't available anymore. Please reload the page and retry.";

export const djangoDebugToolbar: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
};
