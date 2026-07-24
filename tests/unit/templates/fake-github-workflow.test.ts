import { describe, expect, it } from 'vitest';
import { fakeGithubWorkflow } from '../../../src/bait/templates/fake-github-workflow.js';

const ctx = () => ({
  request: new Request('http://example.test/.github/workflows/deploy.yml'),
  path: '/.github/workflows/deploy.yml',
  category: 'config-leak' as const,
  subcategory: 'github-actions',
});

describe('fake-github-workflow', () => {
  it('serves a plausible Actions workflow as YAML', async () => {
    const response = fakeGithubWorkflow(ctx());
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('yaml');
    const text = await response.text();
    expect(text).toMatch(/^name: deploy$/m);
    expect(text).toMatch(/^on:$/m);
    expect(text).toMatch(/^jobs:$/m);
    expect(text).toMatch(/^\s{2}deploy:$/m);
    expect(text).toContain('actions/checkout@v4');
  });

  it('references credentials only through the secrets context', async () => {
    const text = await fakeGithubWorkflow(ctx()).text();
    // Written as regexes rather than literals so the source of this test
    // does not itself contain a `${{ … }}` template-curly string.
    expect(text).toMatch(/\$\{\{ secrets\.REGISTRY_PASSWORD \}\}/);
    expect(text).toMatch(/\$\{\{ secrets\.KUBECONFIG_DATA \}\}/);
    // Nothing shaped like an inlined literal credential.
    expect(text).not.toMatch(
      /(password|secret|token|api[_-]?key)\s*[:=]\s*["']?[A-Za-z0-9/+=]{12,}/i,
    );
  });

  it('uses only non-routable .invalid hosts', async () => {
    const text = await fakeGithubWorkflow(ctx()).text();
    const urls = text.match(/[a-z][a-z0-9+.-]*:\/\/[^\s'"]+/gi) ?? [];
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) expect(url, url).toContain('.invalid');
    expect(text).toContain('registry.internal.invalid');
  });

  it('emits no canary / tracking headers', () => {
    const response = fakeGithubWorkflow(ctx());
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
