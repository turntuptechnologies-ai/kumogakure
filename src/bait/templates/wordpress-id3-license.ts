import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for the `wp-includes/ID3/license.txt` fingerprint
// probe. WordPress vendors the getID3 audio-metadata library under
// `wp-includes/ID3/`, and `license.txt` is one of the stable files
// scanners read to confirm a WordPress install (alongside the
// existing `wp-includes/wlwmanifest.xml` decoy). We return a plain-
// text license blurb that contains the literal string `getID3` —
// the exact fingerprint scanners grep for — without quoting any
// real-person email or copyright line. References to gnu.org and
// mozilla.org are the licenses' canonical URLs (format convention,
// not org attribution).

const body = `license.txt

getID3() is released under multiple licenses. You may use it under
the terms of any one of the following:

  - GNU General Public License (GPL)
    https://www.gnu.org/licenses/gpl.html
  - GNU Lesser General Public License (LGPL)
    https://www.gnu.org/licenses/lgpl.html
  - Mozilla Public License (MPL)
    https://www.mozilla.org/MPL/

(c) getID3() project. All rights reserved by the respective authors.

This file is distributed without warranty of any kind. See the
license texts referenced above for the full terms.
`;

export const wordpressId3License: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
  });
};
