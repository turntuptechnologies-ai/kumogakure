import { describe, expect, it } from 'vitest';
import { findPatternBait, patternBait } from '../../../src/bait/patterns.js';

describe('bait patterns', () => {
  it('matches wp-content PHP uploads', () => {
    expect(findPatternBait('/wp-content/uploads/shell.php')?.category).toBe('webshell');
  });

  it('matches backup file extensions', () => {
    expect(findPatternBait('/database.sql.bak')?.category).toBe('config-leak');
    expect(findPatternBait('/config.old')?.category).toBe('config-leak');
  });

  it('matches .env variants such as .env.production', () => {
    expect(findPatternBait('/.env.production')?.template).toBe('fake-env');
  });

  it('matches .env in any subdirectory as dotenv', () => {
    for (const p of ['/api/.env', '/backend/.env', '/a/b/c/.env']) {
      const m = findPatternBait(p);
      expect(m?.category).toBe('config-leak');
      expect(m?.subcategory).toBe('dotenv');
      expect(m?.template).toBe('fake-env');
    }
  });

  it('matches subdirectory .env.<suffix> as dotenv-variant', () => {
    const m = findPatternBait('/api/.env.production');
    expect(m?.subcategory).toBe('dotenv-variant');
    expect(m?.template).toBe('fake-env');
  });

  it('does not misclassify lookalikes as dotenv', () => {
    for (const p of ['/foo.env', '/environment', '/.environment', '/api/env']) {
      expect(findPatternBait(p)).toBeUndefined();
    }
  });

  it('routes common MCP mount paths to the mcp template', () => {
    for (const p of ['/jsonrpc', '/sse', '/messages', '/api/mcp', '/mcp/v1', '/mcp/']) {
      const m = findPatternBait(p);
      expect(m?.category).toBe('mcp-recon');
      expect(m?.subcategory).toBe('mcp');
      expect(m?.template).toBe('mcp');
    }
  });

  it('does not treat MCP lookalikes as mcp-recon', () => {
    expect(findPatternBait('/mcpfoo')).toBeUndefined();
    expect(findPatternBait('/jsonrpcx')).toBeUndefined();
  });

  it('routes the phpinfo-probe family to the phpinfo decoy', () => {
    for (const p of [
      '/phpinfo.php',
      '/info.php',
      '/p.php',
      '/i.php',
      '/_phpinfo.php',
      '/server-status.php',
      '/admin/phpinfo.php',
      '/test/phpinfo.php',
      '/phpinfo',
      '/info',
      '/_profiler/phpinfo',
    ]) {
      const m = findPatternBait(p);
      expect(m?.category).toBe('config-leak');
      expect(m?.subcategory).toBe('phpinfo');
      expect(m?.template).toBe('phpinfo');
    }
  });

  it('does not over-match generic .php names as phpinfo', () => {
    for (const p of ['/index.php', '/contact.php', '/information.php', '/login.php']) {
      expect(findPatternBait(p)).toBeUndefined();
    }
  });

  it('matches /actuator/* for the generic Spring fallback', () => {
    expect(findPatternBait('/actuator/beans')?.template).toBe('spring-actuator-generic');
  });

  it('matches /.git/* paths', () => {
    expect(findPatternBait('/.git/logs/HEAD')?.category).toBe('config-leak');
  });

  it('returns undefined when no pattern applies', () => {
    expect(findPatternBait('/totally/unrelated')).toBeUndefined();
  });

  it('lists at least the documented number of patterns', () => {
    expect(patternBait.length).toBeGreaterThanOrEqual(10);
  });
});
