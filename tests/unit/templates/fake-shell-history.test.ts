import { describe, expect, it } from 'vitest';
import { fakeShellHistory } from '../../../src/bait/templates/fake-shell-history.js';

const ctx = () => ({
  request: new Request('http://example.test/.bash_history'),
  path: '/.bash_history',
  category: 'config-leak' as const,
  subcategory: 'shell-history',
});

describe('fake-shell-history', () => {
  it('serves a command history as text', async () => {
    const response = fakeShellHistory(ctx());
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    const text = await response.text();
    const lines = text.split('\n').filter((l) => l.trim() !== '');
    expect(lines.length).toBeGreaterThan(20);
    // One command per line, no timestamps or prompts.
    for (const line of lines) expect(line, line).not.toMatch(/^\s|\$\s|^#\d+$/);
    expect(lines.at(-1)).toBe('exit');
  });

  it('reads as an operator session, not a keyword list', async () => {
    const text = await fakeShellHistory(ctx()).text();
    for (const cmd of ['mysqldump', 'psql', 'docker compose', 'kubectl', 'systemctl']) {
      expect(text, cmd).toContain(cmd);
    }
  });

  it('resolves every typed credential to the placeholder', async () => {
    const text = await fakeShellHistory(ctx()).text();
    // Passwords passed on a command line are the whole point of this decoy —
    // they must all be the non-actionable placeholder.
    // Short-option `-p<value>` only — the lookbehind keeps this off long
    // options that happen to end in `-p`, e.g. `--no-pager`.
    const inline = text.match(/(?<![\w-])-p\S+/g) ?? [];
    expect(inline.length).toBeGreaterThan(0);
    for (const p of inline) expect(p, p).toBe('-pREDACTED_FOR_HONEYPOT');
    const exported = text.match(/^export \w*(?:PASSWORD|SECRET|TOKEN)\w*=(.+)$/gm) ?? [];
    expect(exported.length).toBeGreaterThan(0);
    for (const e of exported) expect(e, e).toContain('REDACTED_FOR_HONEYPOT');
  });

  it('uses only non-routable .invalid hosts', async () => {
    const text = await fakeShellHistory(ctx()).text();
    for (const h of text.match(/https?:\/\/([a-z0-9.-]+)/gi) ?? []) {
      expect(h).toContain('.invalid');
    }
    expect(text).toContain('db.internal.invalid');
    expect(text).not.toMatch(/\.(?:com|net|org|io|dev|co\.uk)\b/i);
  });

  it('emits no canary / tracking headers', () => {
    const response = fakeShellHistory(ctx());
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });

  it('serves the same body for every member of the history family', async () => {
    const a = await fakeShellHistory(ctx()).text();
    const b = await fakeShellHistory({
      ...ctx(),
      request: new Request('http://example.test/root/.mysql_history'),
      path: '/root/.mysql_history',
    }).text();
    expect(b).toBe(a);
  });
});
