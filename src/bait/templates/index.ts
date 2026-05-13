import type { TemplateFn, TemplateName } from '../../types.js';
import { drupalLogin } from './drupal-login.js';
import { fakeAwsCredentials } from './fake-aws-credentials.js';
import { fakeEnv } from './fake-env.js';
import { fakeGitConfig } from './fake-git-config.js';
import { fakeGitHead } from './fake-git-head.js';
import { fakeServerStatus } from './fake-server-status.js';
import { fakeWpConfig } from './fake-wp-config.js';
import { joomlaLogin } from './joomla-login.js';
import { phpmyadminLogin } from './phpmyadmin-login.js';
import { wordpressLogin } from './wordpress-login.js';
import { wordpressXmlrpc } from './wordpress-xmlrpc.js';

const notFound: TemplateFn = () => {
  return new Response('Not Found', {
    status: 404,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};

const templates: Record<string, TemplateFn> = {
  'not-found': notFound,
  'wordpress-login': wordpressLogin,
  'wordpress-xmlrpc': wordpressXmlrpc,
  'joomla-login': joomlaLogin,
  'phpmyadmin-login': phpmyadminLogin,
  'drupal-login': drupalLogin,
  'fake-env': fakeEnv,
  'fake-git-config': fakeGitConfig,
  'fake-git-head': fakeGitHead,
  'fake-wp-config': fakeWpConfig,
  'fake-aws-credentials': fakeAwsCredentials,
  'fake-server-status': fakeServerStatus,
};

export function getTemplate(name: TemplateName): TemplateFn {
  return templates[name] ?? notFound;
}

export function registerTemplate(name: TemplateName, fn: TemplateFn): void {
  templates[name] = fn;
}
