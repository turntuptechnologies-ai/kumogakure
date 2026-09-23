import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for Spring Boot's `application.properties` (and the
// `application-<profile>.properties` variants). The `.properties` sibling of
// the spring-application-yml decoy: same "classpath served as static files"
// misconfiguration, same `spring.datasource.*` / mail / JWT secrets in
// cleartext (CWE-200 / CWE-538).
//
// Values mirror spring-application-yml so a scanner fetching both sees one
// consistent app. Hosts are `.invalid`, secrets are `REDACTED_FOR_HONEYPOT`.

const body = `spring.application.name=example-app
server.port=8080

spring.datasource.url=jdbc:mysql://db.example.invalid:3306/example?useSSL=true
spring.datasource.username=app_user
spring.datasource.password=REDACTED_FOR_HONEYPOT
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false

spring.redis.host=redis.example.invalid
spring.redis.port=6379
spring.redis.password=REDACTED_FOR_HONEYPOT

spring.mail.host=smtp.example.invalid
spring.mail.port=587
spring.mail.username=noreply@example.invalid
spring.mail.password=REDACTED_FOR_HONEYPOT

management.endpoints.web.exposure.include=health,info

jwt.secret=REDACTED_FOR_HONEYPOT
jwt.expiration=3600
`;

export const springApplicationProperties: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
  });
};
