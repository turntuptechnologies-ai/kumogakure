import type { TemplateFn } from '../../types.js';

const body = JSON.stringify({
  activeProfiles: ['production'],
  propertySources: [
    {
      name: 'server.ports',
      properties: {
        'local.server.port': { value: 8080 },
      },
    },
    {
      name: 'applicationConfig: [classpath:/application.yml]',
      properties: {
        'spring.datasource.url': {
          value: 'jdbc:mysql://localhost:3306/example_db',
        },
        'spring.datasource.username': { value: 'db_user' },
        'spring.datasource.password': { value: '******' },
        'spring.mail.host': { value: 'smtp.example.invalid' },
        'spring.mail.username': { value: 'mailer@example.invalid' },
        'spring.mail.password': { value: '******' },
      },
    },
    {
      name: 'systemEnvironment',
      properties: {
        JAVA_HOME: {
          value: '/opt/java/openjdk',
          origin: 'System Environment Property "JAVA_HOME"',
        },
        HOSTNAME: { value: 'example-honeypot', origin: 'System Environment Property "HOSTNAME"' },
      },
    },
  ],
});

export const springActuatorEnv: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/vnd.spring-boot.actuator.v3+json' },
  });
};
