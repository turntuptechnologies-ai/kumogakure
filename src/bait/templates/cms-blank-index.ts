import type { TemplateFn } from '../../types.js';

// Tier 3 response for CMS directories that ship a placeholder index file,
// so a real install answers 200 with (almost) nothing instead of a listing
// or a 404:
// - WordPress puts `<?php // Silence is golden.` in `wp-content/`,
//   `plugins/`, `themes/` and most plugin / theme roots → empty body.
// - Joomla 3 puts an `index.html` containing `<!DOCTYPE html><title></title>`
//   in every directory.
// Answering 404 here on a host that otherwise looks like a WordPress /
// Joomla install is a fingerprinting tell.

const JOOMLA_INDEX_HTML = '<!DOCTYPE html><title></title>\n';

export const cmsBlankIndex: TemplateFn = (ctx) => {
  const body = ctx.subcategory === 'joomla-fingerprint' ? JOOMLA_INDEX_HTML : '';
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=UTF-8' },
  });
};
