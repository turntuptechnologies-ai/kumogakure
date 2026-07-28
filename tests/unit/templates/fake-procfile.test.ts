import { describe, expect, it } from 'vitest';
import { fakeProcfile } from '../../../src/bait/templates/fake-procfile.js';

const ctx = () => ({
  request: new Request('http://example.test/Procfile'),
  path: '/Procfile',
  category: 'config-leak' as const,
  subcategory: 'procfile',
});

describe('fake-procfile', () => {
  it('serves process-type declarations as text', async () => {
    const response = fakeProcfile(ctx());
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    const text = await response.text();
    for (const type of ['web', 'worker', 'beat', 'release']) {
      expect(text, type).toMatch(new RegExp(`^${type}: \\S`, 'm'));
    }
  });

  it('keeps every line in `<type>: <command>` form', async () => {
    const text = await fakeProcfile(ctx()).text();
    const lines = text.split('\n').filter((l) => l.trim() !== '');
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) expect(line, line).toMatch(/^[a-z][a-z0-9_-]*: \S/);
  });

  it('discloses no credentials at all', async () => {
    const text = await fakeProcfile(ctx()).text();
    expect(text).not.toMatch(/password|secret|token|api[_-]?key/i);
  });

  it('emits no canary / tracking headers', () => {
    const response = fakeProcfile(ctx());
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });

  it('never reflects the request path', async () => {
    const clean = await fakeProcfile(ctx()).text();
    const dirty = await fakeProcfile({
      ...ctx(),
      request: new Request('http://example.test/app/Procfile'),
      path: '/app/Procfile',
    }).text();
    expect(dirty).toBe(clean);
  });
});
