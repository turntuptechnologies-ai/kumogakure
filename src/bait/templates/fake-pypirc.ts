import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for an exposed ~/.pypirc — the file that carries the
// PyPI API token used by `twine upload`. Structurally authentic so the
// attacker believes they captured a supply-chain publish credential,
// but the token is a non-actionable placeholder per
// docs/RESPONSE_TEMPLATE_POLICY.md. No canary.

const body = `[distutils]
index-servers =
    pypi
    testpypi

[pypi]
username = __token__
password = pypi-REDACTED_FOR_HONEYPOT

[testpypi]
repository = https://test.pypi.org/legacy/
username = __token__
password = pypi-REDACTED_FOR_HONEYPOT
`;

export const fakePypirc: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
  });
};
