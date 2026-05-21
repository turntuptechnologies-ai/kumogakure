import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for wp-includes/wlwmanifest.xml — the
// WordPress-generated Windows Live Writer manifest used as the canonical
// WordPress fingerprint probe. Returning a structurally authentic
// manifest confirms "WordPress here" to the scanner, drawing the
// follow-on probes our existing WordPress decoys can answer.
//
// Policy (docs/RESPONSE_TEMPLATE_POLICY.md, A.2): mimicking the
// service's interface is permitted. We reproduce the WordPress-generated
// XML structure verbatim (it is the standard format), including the
// `{blog-homepage-url}` literals WordPress itself emits at runtime. No
// trademarked logo binaries are embedded — only the standard `imageUrl`
// *path references* that real WordPress writes into this file. Static
// (no attacker reflection); no canary.

const body = `<?xml version="1.0" encoding="UTF-8" ?>
<manifest xmlns="http://schemas.microsoft.com/wlw/manifest/weblog">
  <options>
    <clientType>WordPress</clientType>
    <supportsKeywords>Yes</supportsKeywords>
    <supportsGetTags>Yes</supportsGetTags>
  </options>
  <weblog>
    <serviceName>WordPress</serviceName>
    <imageUrl>images/wlw/WordPress-128.png</imageUrl>
    <watermarkImageUrl>images/wlw/WordPress-Watermark.png</watermarkImageUrl>
    <homepageLinkText>View site</homepageLinkText>
    <adminLinkText>Site Admin</adminLinkText>
    <adminUrl>{blog-homepage-url}wp-admin/</adminUrl>
    <postEditingUrl>{blog-homepage-url}wp-admin/post.php?action=edit&amp;post={post-id}</postEditingUrl>
  </weblog>
  <buttons>
    <button>
      <id>0</id>
      <text>Manage Comments</text>
      <imageUrl>images/wlw/Wordpress-comments.png</imageUrl>
      <clickUrl>{blog-homepage-url}wp-admin/edit-comments.php</clickUrl>
    </button>
  </buttons>
</manifest>
`;

export const fakeWlwmanifest: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=UTF-8' },
  });
};
