import type { TemplateFn, TemplateName } from '../../types.js';
import { apiHealth } from './api-health.js';
import { aspnetTrace } from './aspnet-trace.js';
import { aspnetWebConfig } from './aspnet-web-config.js';
import { awsMetadataRole } from './aws-metadata-role.js';
import { boaFormLogin } from './boa-form-login.js';
import { citrixVpn } from './citrix-vpn.js';
import { composerJson } from './composer-json.js';
import { confluenceTextInline } from './confluence-text-inline.js';
import { cpanelLogin } from './cpanel-login.js';
import { djangoDebugToolbar } from './django-debug-toolbar.js';
import { djangoSettings } from './django-settings.js';
import { dockerComposeYml } from './docker-compose-yml.js';
import { dockerRegistryBase } from './docker-registry-base.js';
import { dockerRegistryCatalog } from './docker-registry-catalog.js';
import { dockerRegistryManifests } from './docker-registry-manifests.js';
import { dockerRegistryTags } from './docker-registry-tags.js';
import { dotnetAppsettings } from './dotnet-appsettings.js';
import { drupalLogin } from './drupal-login.js';
import { drupalSettingsPhp } from './drupal-settings-php.js';
import { exchangeExporttool } from './exchange-exporttool.js';
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
import { fakeVscodeSftp } from './fake-vscode-sftp.js';
import { fakeWlwmanifest } from './fake-wlwmanifest.js';
import { fakeWpConfig } from './fake-wp-config.js';
import { gcpMetadataSa } from './gcp-metadata-sa.js';
import { gitlabSignIn } from './gitlab-sign-in.js';
import { graphqlIntrospection } from './graphql-introspection.js';
import { gravitySmtpSystemReport } from './gravity-smtp-system-report.js';
import { hnap1 } from './hnap1.js';
import { jiraLogin } from './jira-login.js';
import { jiraPomProperties } from './jira-pom-properties.js';
import { joomlaConfigurationPhp } from './joomla-configuration-php.js';
import { joomlaLogin } from './joomla-login.js';
import { laravelTelescope } from './laravel-telescope.js';
import { mcp } from './mcp.js';
import { phpDatabaseConfig } from './php-database-config.js';
import { phpinfo } from './phpinfo.js';
import { phpmyadminLogin } from './phpmyadmin-login.js';
import { solrAdminCores } from './solr-admin-cores.js';
import { springActuatorEnv } from './spring-actuator-env.js';
import { springActuatorGeneric } from './spring-actuator-generic.js';
import { springActuatorHealth } from './spring-actuator-health.js';
import { springApplicationYml } from './spring-application-yml.js';
import { strutsLoginAction } from './struts-login-action.js';
import { swaggerFake } from './swagger-fake.js';
import { swaggerUiHtml } from './swagger-ui-html.js';
import { symfonyParametersYml } from './symfony-parameters-yml.js';
import { symfonyProfiler } from './symfony-profiler.js';
import { uploadSuccess } from './upload-success.js';
import { whmLogin } from './whm-login.js';
import { wordpressId3License } from './wordpress-id3-license.js';
import { wordpressLogin } from './wordpress-login.js';
import { wordpressOembed } from './wordpress-oembed.js';
import { wordpressUsersApi } from './wordpress-users-api.js';
import { wordpressXmlrpc } from './wordpress-xmlrpc.js';
import { yii2Debug } from './yii2-debug.js';

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
  'swagger-ui-html': swaggerUiHtml,
  'fake-vscode-sftp': fakeVscodeSftp,
  'aspnet-trace': aspnetTrace,
  'struts-login-action': strutsLoginAction,
  'laravel-telescope': laravelTelescope,
  'exchange-exporttool': exchangeExporttool,
  'docker-registry-base': dockerRegistryBase,
  'docker-registry-catalog': dockerRegistryCatalog,
  'docker-registry-manifests': dockerRegistryManifests,
  'docker-registry-tags': dockerRegistryTags,
  'jira-login': jiraLogin,
  'jira-pom-properties': jiraPomProperties,
  'yii2-debug': yii2Debug,
  'cpanel-login': cpanelLogin,
  'confluence-text-inline': confluenceTextInline,
  'whm-login': whmLogin,
  'aspnet-web-config': aspnetWebConfig,
  'dotnet-appsettings': dotnetAppsettings,
  'spring-application-yml': springApplicationYml,
  'symfony-parameters-yml': symfonyParametersYml,
  'symfony-profiler': symfonyProfiler,
  'docker-compose-yml': dockerComposeYml,
  'django-settings': djangoSettings,
  'joomla-configuration-php': joomlaConfigurationPhp,
  'drupal-settings-php': drupalSettingsPhp,
  'php-database-config': phpDatabaseConfig,
  'composer-json': composerJson,
  'wordpress-id3-license': wordpressId3License,
  'wordpress-users-api': wordpressUsersApi,
  'wordpress-oembed': wordpressOembed,
  'django-debug-toolbar': djangoDebugToolbar,
};

export function getTemplate(name: TemplateName): TemplateFn {
  return templates[name] ?? notFound;
}

export function registerTemplate(name: TemplateName, fn: TemplateFn): void {
  templates[name] = fn;
}
