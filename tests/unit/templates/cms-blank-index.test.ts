import { describe, expect, it } from 'vitest';
import { cmsBlankIndex } from '../../../src/bait/templates/cms-blank-index.js';

function ctx(path: string, subcategory: string) {
  return {
    request: new Request(`http://example.test${path}`),
    path,
    category: 'cms-auth' as const,
    subcategory,
  };
}

describe('cms-blank-index', () => {
  it('returns an empty 200 for WordPress "Silence is golden" directories', async () => {
    const response = cmsBlankIndex(ctx('/wp-content/plugins/', 'wordpress-fingerprint'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(await response.text()).toBe('');
  });

  it("returns Joomla 3's placeholder index.html for Joomla directories", async () => {
    const response = cmsBlankIndex(ctx('/components/', 'joomla-fingerprint'));
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('<!DOCTYPE html><title></title>\n');
  });
});
