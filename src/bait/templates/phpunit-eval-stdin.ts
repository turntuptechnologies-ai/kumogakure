import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for the PHPUnit `eval-stdin.php` remote code execution —
// CVE-2017-9841. The bundled test helper
// `vendor/phpunit/phpunit/src/Util/PHP/eval-stdin.php` runs
// `eval('?>' . file_get_contents('php://input'))`, so a POST body of
// `<?php … ?>` is executed unauthenticated. It is one of the most sprayed
// RCE probes on the internet; scanners POST a marker payload
// (`<?php echo md5(...); ?>`, `phpinfo();`, or a webshell dropper) and
// check the response for the result.
//
// We return an empty 200 — the exact response a vulnerable eval-stdin.php
// gives for input that emits nothing — so the path fingerprints as
// present while NOTHING is evaluated and the attacker payload is never
// reflected. The honeypot still captures the POST body, which is the
// valuable artefact (the exact dropper / marker the campaign uses).

export const phpunitEvalStdin: TemplateFn = () => {
  return new Response('', {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=UTF-8' },
  });
};
