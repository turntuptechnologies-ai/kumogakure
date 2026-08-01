import { describe, expect, it } from 'vitest';
import { atlassianWebxml } from '../../../src/bait/templates/atlassian-webxml.js';

const path = '/s/abc123def456/_/;/WEB-INF/web.xml';

const ctx = (method: string) => ({
  request: new Request(`http://example.test${path}`, { method }),
  path,
  category: 'cve-recon' as const,
  subcategory: 'atlassian-webxml',
});

describe('atlassian-webxml', () => {
  it('returns a web.xml with the Atlassian Seraph security filter', async () => {
    const response = atlassianWebxml(ctx('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/xml');
    const body = await response.text();
    expect(body).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(body).toContain('<web-app');
    expect(body).toContain('com.atlassian.seraph.filter.SecurityFilter');
  });

  it('emits no canary / tracking headers', () => {
    const response = atlassianWebxml(ctx('GET'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
