import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for Docker registry credential files — the legacy
// `~/.dockercfg` and its modern replacement `~/.docker/config.json`, at any
// depth. Both store a base64 `user:password` per registry, so an exposed
// copy is a direct registry-credential leak (CWE-200 / CWE-522) and a
// supply-chain foothold (push access to images).
//
// The two files differ only in wrapping: `.docker/config.json` nests the
// same map under `auths`. The branch is on which fixed file name matched,
// never on other request content. The `auth` value decodes to
// `deploy:REDACTED_FOR_HONEYPOT`; registry host is `.invalid`.

const auth = 'ZGVwbG95OlJFREFDVEVEX0ZPUl9IT05FWVBPVA==';

const registries = {
  'https://index.docker.io/v1/': { auth, email: 'deploy@example.invalid' },
  'registry.example.invalid': { auth, email: 'deploy@example.invalid' },
};

const legacyBody = JSON.stringify(registries, null, 2);

const configJsonBody = JSON.stringify(
  {
    auths: {
      'https://index.docker.io/v1/': { auth },
      'registry.example.invalid': { auth },
    },
  },
  null,
  2,
);

export const fakeDockercfg: TemplateFn = ({ path }) => {
  const body = path.endsWith('/config.json') ? configJsonBody : legacyBody;
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
  });
};
