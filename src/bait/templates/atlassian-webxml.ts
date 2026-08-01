import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for the Atlassian static-resource path-traversal bypass
// aimed at the deployment descriptor:
//   /s/<token>/_/;/WEB-INF/web.xml
// Same `/s/{token}/_/;` filter bypass as the Jira pom.properties
// fingerprint (see jira-pom-properties.ts / CVE-2019-8442 family) —
// the `;`-segment slips past the SecurityFilter's URL match and reaches
// a raw resource read. Here the target is the container-level
// deployment descriptor rather than a version file, so we return a
// generic Atlassian-shaped `web.xml` (Seraph security filter, the
// shared authentication layer across Jira/Confluence/Bamboo/Crowd)
// instead of pinning to one product.

const body = `<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="http://java.sun.com/xml/ns/javaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://java.sun.com/xml/ns/javaee http://java.sun.com/xml/ns/javaee/web-app_2_5.xsd"
         version="2.5">
  <display-name>Atlassian Web Application</display-name>
  <filter>
    <filter-name>security</filter-name>
    <filter-class>com.atlassian.seraph.filter.SecurityFilter</filter-class>
  </filter>
  <filter-mapping>
    <filter-name>security</filter-name>
    <url-pattern>/*</url-pattern>
  </filter-mapping>
  <context-param>
    <param-name>webwork.multipart.saveDir</param-name>
    <param-value>/tmp</param-value>
  </context-param>
  <session-config>
    <session-timeout>60</session-timeout>
  </session-config>
</web-app>
`;

export const atlassianWebxml: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=UTF-8' },
  });
};
