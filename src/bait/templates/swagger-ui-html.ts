import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for Swagger UI HTML entrypoints (the Java/Spring,
// SpringFox, and webjars conventions all settle on small variants of
// the same `<div id="swagger-ui"></div>` shell). We render a minimal
// page that boots SwaggerUIBundle against `/swagger.json` so scanners
// that follow the spec link land on the existing `swagger-fake`
// decoy. CDN URLs use the public unpkg / jsdelivr conventions — they
// are part of the Swagger UI distribution shape, not org attribution.

const body = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Swagger UI</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: "/swagger.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>`;

export const swaggerUiHtml: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=UTF-8' },
  });
};
