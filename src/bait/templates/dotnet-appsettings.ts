import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for ASP.NET Core `appsettings.json`. Same disclosure
// class as `web.config` but the .NET Core era — JSON-shaped, with
// `ConnectionStrings`, `Jwt`, and `Logging` sections. Direct
// credential / signing-key theft if a real one is exposed
// (CWE-200 / CWE-538).
//
// All values fabricated; DB host on `.invalid`, secrets are
// `REDACTED_FOR_HONEYPOT`. Standard section names (`AllowedHosts`,
// `Logging.LogLevel.Default`, etc.) are the .NET Core convention —
// format shape, not org attribution.

const body = JSON.stringify(
  {
    Logging: {
      LogLevel: {
        Default: 'Information',
        'Microsoft.AspNetCore': 'Warning',
      },
    },
    AllowedHosts: '*',
    ConnectionStrings: {
      DefaultConnection:
        'Server=db.example.invalid;Database=example;User Id=app_user;Password=REDACTED_FOR_HONEYPOT;TrustServerCertificate=True',
    },
    Jwt: {
      Issuer: 'https://api.example.invalid',
      Audience: 'https://api.example.invalid',
      Key: 'REDACTED_FOR_HONEYPOT',
      ExpiryMinutes: 60,
    },
    Storage: {
      ConnectionString: 'REDACTED_FOR_HONEYPOT',
      ContainerName: 'app-data',
    },
  },
  null,
  2,
);

export const dotnetAppsettings: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
  });
};
