import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for Spring Boot's `application.yml`. Probed at depths
// like `/application.yml`, `/config/application.yml`,
// `/src/main/resources/application.yml`, `/BOOT-INF/classes/...` —
// whenever the JAR / classpath is mis-served as static files, the
// scanner reads `spring.datasource.*` (DB creds) and security
// secrets in cleartext (CWE-200 / CWE-538). Not a single product
// CVE; it's the "app config served as source" misconfiguration.
//
// Output is YAML with the canonical Spring Boot sections:
// `spring.datasource`, `spring.redis`, `server`, `management`, `jwt`.
// All hostnames on `.invalid`, secrets are `REDACTED_FOR_HONEYPOT`.

const body = `spring:
  application:
    name: example-app
  datasource:
    url: jdbc:mysql://db.example.invalid:3306/example?useSSL=true
    username: app_user
    password: REDACTED_FOR_HONEYPOT
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
  redis:
    host: redis.example.invalid
    port: 6379
    password: REDACTED_FOR_HONEYPOT

server:
  port: 8080
  servlet:
    context-path: /

management:
  endpoints:
    web:
      exposure:
        include: health,info

jwt:
  secret: REDACTED_FOR_HONEYPOT
  expiration: 3600
`;

export const springApplicationYml: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/x-yaml; charset=UTF-8' },
  });
};
