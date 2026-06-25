import { describe, expect, it } from 'vitest';
import { fakeGitlabCi } from '../../../src/bait/templates/fake-gitlab-ci.js';

const ctx = () => ({
  request: new Request('http://example.test/.gitlab-ci.yml'),
  path: '/.gitlab-ci.yml',
  category: 'config-leak' as const,
  subcategory: 'gitlab-ci',
});

describe('fake-gitlab-ci', () => {
  it('serves a plausible pipeline as YAML', async () => {
    const response = fakeGitlabCi(ctx());
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('yaml');
    const text = await response.text();
    expect(text).toContain('stages:');
    expect(text).toMatch(/^\s*deploy:/m);
  });

  it('references masked CI variables, not inlined secret values', async () => {
    const text = await fakeGitlabCi(ctx()).text();
    // Secrets appear only as $CI_* variable references.
    expect(text).toContain('$CI_REGISTRY_PASSWORD');
    // No literal-looking credential assignment.
    expect(text).not.toMatch(/(password|secret|token)\s*[:=]\s*["']?[A-Za-z0-9/+]{12,}/i);
  });

  it('uses only non-routable .invalid hosts', async () => {
    const text = await fakeGitlabCi(ctx()).text();
    const hosts = text.match(/https?:\/\/([a-z0-9.-]+)/gi) ?? [];
    for (const h of hosts) expect(h).toContain('.invalid');
  });

  it('emits no canary / tracking headers', () => {
    const response = fakeGitlabCi(ctx());
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
