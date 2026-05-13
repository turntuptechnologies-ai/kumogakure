import { describe, expect, it } from 'vitest';
import { fakeServerStatus } from '../../../src/bait/templates/fake-server-status.js';

const ctx = (method: string) => ({
  request: new Request('http://example.test/server-status', { method }),
  path: '/server-status',
  category: 'config-leak' as const,
  subcategory: 'apache',
});

describe('fake-server-status', () => {
  it('returns Apache-style HTML status page', async () => {
    const response = fakeServerStatus(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    const body = await response.text();
    expect(body).toContain('Apache Server Status');
    expect(body).toContain('Server Version: Apache');
    expect(body).toContain('Current Time:');
    expect(body).toContain('Server uptime:');
  });
});
