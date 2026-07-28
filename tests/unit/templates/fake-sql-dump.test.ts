import { describe, expect, it } from 'vitest';
import { fakeSqlDump } from '../../../src/bait/templates/fake-sql-dump.js';

const ctx = () => ({
  request: new Request('http://example.test/database.sql'),
  path: '/database.sql',
  category: 'config-leak' as const,
  subcategory: 'sql-dump',
});

describe('fake-sql-dump', () => {
  it('serves mysqldump-shaped SQL', async () => {
    const response = fakeSqlDump(ctx());
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    const text = await response.text();
    expect(text).toContain('-- MySQL dump');
    expect(text).toContain('DROP TABLE IF EXISTS');
    expect(text).toContain('CREATE TABLE');
    expect(text).toContain('LOCK TABLES');
    expect(text).toContain('UNLOCK TABLES');
    expect(text).toContain('-- Dump completed on');
  });

  it('includes the user table a scanner would go looking for', async () => {
    const text = await fakeSqlDump(ctx()).text();
    expect(text).toContain('`wp_users`');
    expect(text).toMatch(/INSERT INTO `wp_users` VALUES/);
  });

  it('carries no crackable password hash', async () => {
    const text = await fakeSqlDump(ctx()).text();
    // Every wp_users row's `user_pass` column is the placeholder, not a hash.
    const block = text.split('INSERT INTO `wp_users` VALUES')[1]?.split(';')[0] ?? '';
    const rows = block.match(/\(\d+,'[^']*','([^']*)'/g) ?? [];
    expect(rows.length).toBeGreaterThan(2);
    for (const row of rows) expect(row, row).toContain("'REDACTED_FOR_HONEYPOT'");
    // No bcrypt / phpass / MD5-crypt / raw-MD5 shaped value anywhere.
    expect(text).not.toMatch(/\$(?:2[aby]|P|H|1|5|6)\$/);
    expect(text).not.toMatch(/'[0-9a-f]{32,}'/i);
  });

  it('uses only non-routable .invalid hosts and addresses', async () => {
    const text = await fakeSqlDump(ctx()).text();
    const hosts = text.match(/https?:\/\/([a-z0-9.-]+)/gi) ?? [];
    expect(hosts.length).toBeGreaterThan(0);
    for (const h of hosts) expect(h).toContain('.invalid');
    const emails = text.match(/[a-z0-9._-]+@[a-z0-9.-]+/gi) ?? [];
    expect(emails.length).toBeGreaterThan(0);
    for (const e of emails) expect(e).toMatch(/\.invalid$/);
  });

  it('emits no canary / tracking headers', () => {
    const response = fakeSqlDump(ctx());
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });

  it('never reflects the request path', async () => {
    const a = await fakeSqlDump(ctx()).text();
    const b = await fakeSqlDump({
      ...ctx(),
      request: new Request('http://example.test/backup/<script>.sql'),
      path: '/backup/<script>.sql',
    }).text();
    expect(b).toBe(a);
    expect(b).not.toContain('<script>');
  });
});
