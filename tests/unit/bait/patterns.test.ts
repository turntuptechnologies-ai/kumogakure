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

  it('routes git home-dotfiles at any depth, splitting credentials', () => {
    for (const p of ['/root/.gitconfig', '/.gitconfig', '/home/u/.gitconfig']) {
      const m = findPatternBait(p);
      expect(m?.category).toBe('config-leak');
      expect(m?.subcategory).toBe('git');
      expect(m?.template).toBe('fake-gitconfig');
    }
    for (const p of ['/root/.git-credentials', '/.git-credentials', '/var/www/.git-credentials']) {
      const m = findPatternBait(p);
      expect(m?.category).toBe('config-leak');
      expect(m?.subcategory).toBe('git-credentials');
      expect(m?.template).toBe('fake-git-credentials');
    }
  });

  it('routes cloud credential dotfiles at any depth, config split out', () => {
    const credCases: Array<[string, string]> = [
      ['/root/.aws/credentials', 'fake-aws-credentials'],
      ['/.aws/credentials', 'fake-aws-credentials'],
      ['/root/.s3cfg', 'fake-s3cfg'],
      ['/.s3cfg', 'fake-s3cfg'],
      ['/root/.boto', 'fake-boto'],
      ['/.boto', 'fake-boto'],
    ];
    for (const [p, tpl] of credCases) {
      const m = findPatternBait(p);
      expect(m?.category).toBe('config-leak');
      expect(m?.subcategory).toBe('cloud-credentials');
      expect(m?.template).toBe(tpl);
    }
    for (const p of ['/root/.aws/config', '/.aws/config', '/home/u/.aws/config']) {
      const m = findPatternBait(p);
      expect(m?.category).toBe('config-leak');
      expect(m?.subcategory).toBe('aws');
      expect(m?.template).toBe('fake-aws-config');
    }
  });

  it('does not over-match cloud credential lookalikes', () => {
    for (const p of ['/foo.boto', '/.s3cfgx', '/.aws/credentialsx', '/.aws', '/aws/config']) {
      expect(findPatternBait(p)).toBeUndefined();
    }
  });

  it('routes .netrc / _netrc at any depth to the netrc decoy', () => {
    for (const p of ['/.netrc', '/root/.netrc', '/home/u/_netrc', '/var/www/.netrc']) {
      const m = findPatternBait(p);
      expect(m?.category).toBe('config-leak');
      expect(m?.subcategory).toBe('netrc');
      expect(m?.template).toBe('fake-netrc');
    }
  });

  it('does not over-match netrc lookalikes', () => {
    for (const p of ['/foo.netrc', '/.netrcx', '/netrc', '/.netr']) {
      expect(findPatternBait(p)).toBeUndefined();
    }
  });

  it('does not over-match git dotfile lookalikes and leaves .git/ intact', () => {
    expect(findPatternBait('/foo.gitconfig')).toBeUndefined();
    expect(findPatternBait('/gitconfig')).toBeUndefined();
    expect(findPatternBait('/.gitconfigx')).toBeUndefined();
    // The existing .git/ repo family is unchanged (different filename).
    expect(findPatternBait('/.git/config')?.subcategory).toBe('git');
    expect(findPatternBait('/.git/config')?.template).toBe('not-found');
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
