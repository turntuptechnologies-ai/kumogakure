import { describe, expect, it } from 'vitest';
import { swaggerUiHtml } from '../../../src/bait/templates/swagger-ui-html.js';

const ctx = (method: string) => ({
  request: new Request('http://example.test/swagger-ui.html', { method }),
  path: '/swagger-ui.html',
  category: 'api-recon' as const,
  subcategory: 'openapi',
});

describe('swagger-ui-html', () => {
  it('returns an HTML page that boots SwaggerUIBundle against /swagger.json', async () => {
    const response = swaggerUiHtml(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    const body = await response.text();
    expect(body).toContain('<div id="swagger-ui"></div>');
    expect(body).toContain('SwaggerUIBundle');
    // Follow-through to the existing swagger-fake JSON decoy.
    expect(body).toContain('"/swagger.json"');
  });

  it('emits no canary / tracking headers', () => {
    const response = swaggerUiHtml(ctx('GET'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
