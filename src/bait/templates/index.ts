import type { TemplateFn, TemplateName } from '../../types.js';
import { apiHealth } from './api-health.js';
import { awsMetadataRole } from './aws-metadata-role.js';
import { boaFormLogin } from './boa-form-login.js';
import { citrixVpn } from './citrix-vpn.js';
import { drupalLogin } from './drupal-login.js';
import { exchangeOwaLogin } from './exchange-owa-login.js';
import { fakeAwsConfig } from './fake-aws-config.js';
import { fakeAwsCredentials } from './fake-aws-credentials.js';
import { fakeBoto } from './fake-boto.js';
import { fakeEnv } from './fake-env.js';
import { fakeGcpServiceAccountKey } from './fake-gcp-service-account-key.js';
import { fakeGitConfig } from './fake-git-config.js';
import { fakeGitCredentials } from './fake-git-credentials.js';
import { fakeGitDirListing } from './fake-git-dir-listing.js';
import { fakeGitHead } from './fake-git-head.js';
import { fakeGitattributes } from './fake-gitattributes.js';
import { fakeGitconfig } from './fake-gitconfig.js';
import { fakeGitignore } from './fake-gitignore.js';
import { fakeGitmodules } from './fake-gitmodules.js';
import { fakeNetrc } from './fake-netrc.js';
import { fakeNpmrc } from './fake-npmrc.js';
import { fakePypirc } from './fake-pypirc.js';
import { fakeS3cfg } from './fake-s3cfg.js';
import { fakeServerStatus } from './fake-server-status.js';
import { fakeWlwmanifest } from './fake-wlwmanifest.js';
import { fakeWpConfig } from './fake-wp-config.js';
import { gcpMetadataSa } from './gcp-metadata-sa.js';
import { gitlabSignIn } from './gitlab-sign-in.js';
import { graphqlIntrospection } from './graphql-introspection.js';
import { gravitySmtpSystemReport } from './gravity-smtp-system-report.js';
import { hnap1 } from './hnap1.js';
import { joomlaLogin } from './joomla-login.js';
import { mcp } from './mcp.js';
import { phpinfo } from './phpinfo.js';
import { phpmyadminLogin } from './phpmyadmin-login.js';
import { solrAdminCores } from './solr-admin-cores.js';
import { springActuatorEnv } from './spring-actuator-env.js';
import { springActuatorGeneric } from './spring-actuator-generic.js';
import { springActuatorHealth } from './spring-actuator-health.js';
import { swaggerFake } from './swagger-fake.js';
import { uploadSuccess } from './upload-success.js';
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
  'spring-actuator-health': springActuatorHealth,
  'spring-actuator-env': springActuatorEnv,
  'spring-actuator-generic': springActuatorGeneric,
  'solr-admin-cores': solrAdminCores,
  'citrix-vpn': citrixVpn,
  'exchange-owa-login': exchangeOwaLogin,
  'gitlab-sign-in': gitlabSignIn,
  'aws-metadata-role': awsMetadataRole,
  'gcp-metadata-sa': gcpMetadataSa,
  'upload-success': uploadSuccess,
  'swagger-fake': swaggerFake,
  'graphql-introspection': graphqlIntrospection,
  'api-health': apiHealth,
  hnap1: hnap1,
  'boa-form-login': boaFormLogin,
  mcp: mcp,
  phpinfo: phpinfo,
  'gravity-smtp-system-report': gravitySmtpSystemReport,
  'fake-gitconfig': fakeGitconfig,
  'fake-git-credentials': fakeGitCredentials,
  'fake-aws-config': fakeAwsConfig,
  'fake-s3cfg': fakeS3cfg,
  'fake-boto': fakeBoto,
  'fake-netrc': fakeNetrc,
  'fake-npmrc': fakeNpmrc,
  'fake-pypirc': fakePypirc,
  'fake-git-dir-listing': fakeGitDirListing,
  'fake-gitignore': fakeGitignore,
  'fake-gitattributes': fakeGitattributes,
  'fake-gitmodules': fakeGitmodules,
  'fake-wlwmanifest': fakeWlwmanifest,
  'fake-gcp-service-account-key': fakeGcpServiceAccountKey,
};

export function getTemplate(name: TemplateName): TemplateFn {
  return templates[name] ?? notFound;
}

export function registerTemplate(name: TemplateName, fn: TemplateFn): void {
  templates[name] = fn;
}
