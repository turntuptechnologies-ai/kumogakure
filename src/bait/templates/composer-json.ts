import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for PHP's `composer.json`. Doesn't carry secrets, but
// scanners hit it to enumerate dependency versions for downstream
// CVE matching ("which exact symfony/http-foundation are they
// running?"). Same scanning class as `package.json` / `pom.properties`
// version-disclosure paths. We return a plausible application
// manifest with fabricated pinned versions.

const body = JSON.stringify(
  {
    name: 'example/app',
    description: 'Example application',
    type: 'project',
    license: 'proprietary',
    require: {
      php: '^8.2',
      'symfony/framework-bundle': '^7.1',
      'symfony/http-foundation': '^7.1',
      'doctrine/orm': '^3.2',
      'guzzlehttp/guzzle': '^7.9',
      'monolog/monolog': '^3.7',
      'twig/twig': '^3.10',
    },
    'require-dev': {
      phpunit: '^11.3',
      'phpstan/phpstan': '^1.12',
    },
    autoload: {
      'psr-4': {
        'App\\': 'src/',
      },
    },
    'autoload-dev': {
      'psr-4': {
        'App\\Tests\\': 'tests/',
      },
    },
    config: {
      'allow-plugins': {
        'composer/package-versions-deprecated': true,
      },
      'preferred-install': {
        '*': 'dist',
      },
    },
    'minimum-stability': 'stable',
    'prefer-stable': true,
  },
  null,
  2,
);

export const composerJson: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
  });
};
