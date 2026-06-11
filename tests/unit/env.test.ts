import { describe, expect, it } from 'vitest';
import { parsePositiveInt } from '../../src/env.js';

describe('parsePositiveInt', () => {
  it('parses a positive integer string', () => {
    expect(parsePositiveInt('1024')).toBe(1024);
  });

  it('parses leading-integer strings the way parseInt does', () => {
    expect(parsePositiveInt('30days')).toBe(30);
  });

  it('returns undefined for undefined', () => {
    expect(parsePositiveInt(undefined)).toBeUndefined();
  });

  it('returns undefined for non-numeric input', () => {
    expect(parsePositiveInt('not-a-number')).toBeUndefined();
  });

  it('returns undefined for zero and negative values', () => {
    expect(parsePositiveInt('0')).toBeUndefined();
    expect(parsePositiveInt('-1')).toBeUndefined();
  });

  it('returns undefined for the empty string', () => {
    expect(parsePositiveInt('')).toBeUndefined();
  });
});
