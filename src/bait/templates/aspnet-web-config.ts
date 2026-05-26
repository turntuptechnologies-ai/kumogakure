import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for ASP.NET (Framework) `web.config`. Not a single CVE;
// the surface is the classic IIS/.NET misconfiguration where the
// raw XML is served as text (often via path-traversal, mis-mapped
// MIME handlers, or a leftover backup like `web.config.bak`) and
// reveals `<connectionStrings>` and `<appSettings>` in plaintext —
// direct DB-credential / API-key theft (CWE-200 / CWE-538).
//
// We return a minimal-but-shaped web.config with a placeholder
// SQL Server connection string and a couple of `appSettings`. No
// real server hostname or password.

const body = `<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <connectionStrings>
    <add name="DefaultConnection"
         connectionString="Data Source=db.example.invalid;Initial Catalog=example;User Id=app_user;Password=REDACTED_FOR_HONEYPOT"
         providerName="System.Data.SqlClient" />
  </connectionStrings>
  <appSettings>
    <add key="ApiBaseUrl" value="https://api.example.invalid" />
    <add key="JwtSigningKey" value="REDACTED_FOR_HONEYPOT" />
    <add key="StorageAccountKey" value="REDACTED_FOR_HONEYPOT" />
  </appSettings>
  <system.web>
    <compilation debug="false" targetFramework="4.8" />
    <httpRuntime targetFramework="4.8" />
    <authentication mode="Forms">
      <forms loginUrl="~/Account/Login" timeout="2880" />
    </authentication>
  </system.web>
</configuration>
`;

export const aspnetWebConfig: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=UTF-8' },
  });
};
