import { describe, expect, it } from 'vitest';
import { fakeMakefile } from '../../../src/bait/templates/fake-makefile.js';

const ctx = () => ({
  request: new Request('http://example.test/Makefile'),
  path: '/Makefile',
  category: 'config-leak' as const,
  subcategory: 'makefile',
});

describe('fake-makefile', () => {
  it('serves a project Makefile as text', async () => {
    const response = fakeMakefile(ctx());
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    const text = await response.text();
    expect(text).toMatch(/^\.PHONY:/m);
    expect(text).toMatch(/^\.DEFAULT_GOAL := help$/m);
    for (const target of ['build', 'test', 'deploy', 'migrate', 'backup']) {
      expect(text, target).toMatch(new RegExp(`^${target}:`, 'm'));
    }
  });

  it('indents recipe lines with tabs, as make requires', async () => {
    const text = await fakeMakefile(ctx()).text();
    const recipes = text.split('\n').filter((l) => l.startsWith('\t'));
    expect(recipes.length).toBeGreaterThan(5);
    // No space-indented recipe line, which make would reject.
    expect(text).not.toMatch(/^ {2,}\S/m);
  });

  it('reads secrets from the environment rather than inlining them', async () => {
    const text = await fakeMakefile(ctx()).text();
    expect(text).toMatch(/DB_PASSWORD\s+\?=/);
    expect(text).toContain('APP_DB_PASSWORD');
    expect(text).not.toMatch(
      /(password|secret|token|api[_-]?key)\s*[:=]+\s*["']?[A-Za-z0-9/+]{12,}/i,
    );
  });

  it('uses only non-routable .invalid hosts', async () => {
    const text = await fakeMakefile(ctx()).text();
    for (const h of text.match(/https?:\/\/([a-z0-9.-]+)/gi) ?? []) {
      expect(h).toContain('.invalid');
    }
    expect(text).toContain('registry.internal.invalid');
    expect(text).not.toMatch(/\.(?:com|net|org|io|dev|co\.uk)\b/i);
  });

  it('emits no canary / tracking headers', () => {
    const response = fakeMakefile(ctx());
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });

  it('never reflects the request path', async () => {
    const clean = await fakeMakefile(ctx()).text();
    const dirty = await fakeMakefile({
      ...ctx(),
      request: new Request('http://example.test/build/Makefile'),
      path: '/build/Makefile',
    }).text();
    expect(dirty).toBe(clean);
  });
});
