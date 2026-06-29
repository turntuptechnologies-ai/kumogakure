import { describe, expect, it } from 'vitest';
import { fakeSvnEntries } from '../../../src/bait/templates/fake-svn-entries.js';

const ctx = () => ({
  request: new Request('http://example.test/.svn/entries'),
  path: '/.svn/entries',
  category: 'config-leak' as const,
  subcategory: 'svn',
});

describe('fake-svn-entries', () => {
  it('serves the old-format entries with a fabricated repo URL', async () => {
    const response = fakeSvnEntries(ctx());
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    const text = await response.text();
    // format-10 marker + dir node
    expect(text.split('\n')[0]).toBe('10');
    expect(text).toContain('dir');
    // the harvestable repo URL, on a non-routable host
    expect(text).toMatch(/https:\/\/svn\.internal\.invalid\/app\/trunk/);
  });

  it('uses only non-routable .invalid hosts', async () => {
    const text = await fakeSvnEntries(ctx()).text();
    for (const u of text.match(/https?:\/\/[a-z0-9.-]+/gi) ?? []) {
      expect(u).toContain('.invalid');
    }
  });

  it('emits no canary / tracking headers', () => {
    const response = fakeSvnEntries(ctx());
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
