import { describe, expect, it } from 'vitest';
import { getTemplate, registerTemplate } from '../../../src/bait/templates/index.js';
import type { TemplateFn } from '../../../src/types.js';

const ctx = {
  request: new Request('http://example.test/'),
  path: '/',
  category: 'unknown' as const,
};

describe('templates registry', () => {
  it('resolves known templates', async () => {
    const template = getTemplate('wordpress-login');
    const response = template(ctx);
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('<form');
  });

  it('falls back to not-found for unknown template names', async () => {
    const template = getTemplate('does-not-exist');
    const response = template(ctx);
    expect(response.status).toBe(404);
    const body = await response.text();
    expect(body).toBe('Not Found');
  });

  it('allows registering a new template at runtime', async () => {
    const custom: TemplateFn = () => new Response('hello', { status: 200 });
    registerTemplate('custom-test-template', custom);
    const response = getTemplate('custom-test-template')(ctx);
    const body = await response.text();
    expect(body).toBe('hello');
  });
});
