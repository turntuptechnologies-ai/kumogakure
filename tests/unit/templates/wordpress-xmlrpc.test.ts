import { describe, expect, it } from 'vitest';
import { wordpressXmlrpc } from '../../../src/bait/templates/wordpress-xmlrpc.js';

const ctx = (method: string) => ({
  request: new Request('http://example.test/xmlrpc.php', { method }),
  path: '/xmlrpc.php',
  category: 'cms-auth' as const,
  subcategory: 'wordpress',
});

describe('wordpress-xmlrpc', () => {
  it('returns plain-text guidance for GET', async () => {
    const response = wordpressXmlrpc(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    const body = await response.text();
    expect(body).toBe('XML-RPC server accepts POST requests only.');
  });

  it('returns XML-RPC fault response for POST', async () => {
    const response = wordpressXmlrpc(ctx('POST'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/xml');
    const body = await response.text();
    expect(body).toContain('<methodResponse>');
    expect(body).toContain('<fault>');
    expect(body).toContain('Incorrect username or password.');
  });
});
