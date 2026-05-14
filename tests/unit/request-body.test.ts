import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BODY_READ_LIMIT,
  readRequestBody,
  resolveBodyReadLimit,
} from '../../src/request-body.js';

describe('resolveBodyReadLimit', () => {
  it('parses a numeric string', () => {
    expect(resolveBodyReadLimit('1024')).toBe(1024);
  });

  it('falls back to the default for undefined', () => {
    expect(resolveBodyReadLimit(undefined)).toBe(DEFAULT_BODY_READ_LIMIT);
  });

  it('falls back to the default for non-numeric input', () => {
    expect(resolveBodyReadLimit('not-a-number')).toBe(DEFAULT_BODY_READ_LIMIT);
  });

  it('falls back to the default for zero or negative values', () => {
    expect(resolveBodyReadLimit('0')).toBe(DEFAULT_BODY_READ_LIMIT);
    expect(resolveBodyReadLimit('-1')).toBe(DEFAULT_BODY_READ_LIMIT);
  });
});

describe('readRequestBody', () => {
  it('returns empty for GET requests without reading the body', async () => {
    const request = new Request('http://example.test/', { method: 'GET' });
    const result = await readRequestBody(request, 100);
    expect(result).toEqual({ body: '', size: 0, truncated: false });
  });

  it('returns empty for HEAD requests', async () => {
    const request = new Request('http://example.test/', { method: 'HEAD' });
    const result = await readRequestBody(request, 100);
    expect(result).toEqual({ body: '', size: 0, truncated: false });
  });

  it('reads small bodies in full', async () => {
    const payload = 'hello world';
    const request = new Request('http://example.test/', { method: 'POST', body: payload });
    const result = await readRequestBody(request, 1024);
    expect(result.body).toBe(payload);
    expect(result.size).toBe(payload.length);
    expect(result.truncated).toBe(false);
  });

  it('truncates bodies that exceed the limit', async () => {
    const payload = 'a'.repeat(2048);
    const request = new Request('http://example.test/', { method: 'POST', body: payload });
    const result = await readRequestBody(request, 512);
    expect(result.body.length).toBe(512);
    expect(result.body).toBe('a'.repeat(512));
    expect(result.size).toBe(512);
    expect(result.truncated).toBe(true);
  });

  it('keeps exactly-at-limit bodies untruncated', async () => {
    const payload = 'b'.repeat(256);
    const request = new Request('http://example.test/', { method: 'POST', body: payload });
    const result = await readRequestBody(request, 256);
    expect(result.body.length).toBe(256);
    expect(result.size).toBe(256);
    expect(result.truncated).toBe(false);
  });

  it('handles requests with no body', async () => {
    const request = new Request('http://example.test/', { method: 'DELETE' });
    const result = await readRequestBody(request, 100);
    expect(result.body).toBe('');
    expect(result.size).toBe(0);
    expect(result.truncated).toBe(false);
  });
});
