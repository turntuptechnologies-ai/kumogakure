import { describe, expect, it } from 'vitest';
import { explicitBait, findExplicitBait } from '../../../src/bait/catalog.js';

describe('bait catalog', () => {
  it('finds an explicit bait entry by exact path', () => {
    const entry = findExplicitBait('/wp-login.php');
    expect(entry).toBeDefined();
    expect(entry?.category).toBe('cms-auth');
    expect(entry?.subcategory).toBe('wordpress');
    expect(entry?.template).toBe('wordpress-login');
  });

  it('returns undefined for unknown paths', () => {
    expect(findExplicitBait('/no-such-path')).toBeUndefined();
  });

  it('uses exact-path matching (does not match prefixes)', () => {
    expect(findExplicitBait('/wp-login.php/extra')).toBeUndefined();
  });

  it('exposes a stable set of expected paths', () => {
    const paths = explicitBait.map((b) => b.path);
    expect(paths).toContain('/wp-login.php');
    expect(paths).toContain('/.env');
    expect(paths).toContain('/actuator/health');
    expect(paths).toContain('/latest/meta-data/iam/security-credentials/');
    expect(paths).toContain('/swagger.json');
    expect(paths).toContain('/HNAP1/');
  });

  it('routes /mcp to the mcp decoy', () => {
    const entry = findExplicitBait('/mcp');
    expect(entry?.category).toBe('mcp-recon');
    expect(entry?.subcategory).toBe('mcp');
    expect(entry?.template).toBe('mcp');
  });

  it('has no duplicate paths', () => {
    const paths = explicitBait.map((b) => b.path);
    expect(new Set(paths).size).toBe(paths.length);
  });
});
