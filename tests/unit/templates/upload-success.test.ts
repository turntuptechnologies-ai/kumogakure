import { describe, expect, it } from 'vitest';
import { uploadSuccess } from '../../../src/bait/templates/upload-success.js';

const ctx = {
  request: new Request('http://example.test/upload.php', { method: 'POST' }),
  path: '/upload.php',
  category: 'webshell' as const,
  subcategory: 'generic',
};

describe('upload-success', () => {
  it('returns a generic success message to elicit follow-up requests', async () => {
    const response = uploadSuccess(ctx);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    const body = await response.text();
    expect(body.trim()).toBe('File uploaded successfully.');
  });
});
