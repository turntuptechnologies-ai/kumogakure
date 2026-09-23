import { describe, expect, it } from 'vitest';
import { execApi } from '../../../src/bait/templates/exec-api.js';

const ctx = (path: string) => ({
  request: new Request(`http://example.test${path}`),
  path,
  category: 'webshell' as const,
  subcategory: 'exec-api',
});

describe('exec-api', () => {
  it('returns a 400 JSON validation error naming the missing command field', async () => {
    const response = execApi(ctx('/api/exec'));
    expect(response.status).toBe(400);
    expect(response.headers.get('content-type')).toContain('application/json');
    const json = (await response.json()) as { status: string; message: string };
    expect(json.status).toBe('error');
    expect(json.message).toContain('command');
  });

  it('never reflects the request', async () => {
    const text = await execApi(ctx('/api/exec?cmd=id;uname%20-a')).text();
    expect(text).not.toContain('uname');
    expect(text).not.toContain('/api/exec');
  });

  it('emits no canary / tracking headers', () => {
    const response = execApi(ctx('/api/run'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
