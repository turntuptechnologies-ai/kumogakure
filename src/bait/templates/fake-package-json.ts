import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for Node's `package.json`. Doesn't carry secrets, but
// scanners hit it to enumerate dependency versions for downstream CVE
// matching ("which exact express / lodash are they running?") — the same
// version-disclosure class as the `composer.json` / `pom.properties`
// decoys. We return a plausible application manifest with fabricated
// pinned versions. Fully static; the request is never reflected.

const body = JSON.stringify(
  {
    name: 'app',
    version: '1.4.2',
    private: true,
    description: 'Application server',
    type: 'module',
    scripts: {
      start: 'node dist/server.js',
      build: 'tsc -p tsconfig.json',
      test: 'vitest run',
    },
    dependencies: {
      express: '^4.21.0',
      pg: '^8.12.0',
      ioredis: '^5.4.1',
      zod: '^3.23.8',
      pino: '^9.4.0',
      jsonwebtoken: '^9.0.2',
      dotenv: '^16.4.5',
    },
    devDependencies: {
      typescript: '^5.6.2',
      vitest: '^2.1.1',
      '@types/node': '^22.5.5',
    },
    engines: {
      node: '>=20',
    },
  },
  null,
  2,
);

export const fakePackageJson: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
  });
};
