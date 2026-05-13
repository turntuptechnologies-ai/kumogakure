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
