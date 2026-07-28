import { describe, expect, it } from 'vitest';
import { fakeCiPipeline } from '../../../src/bait/templates/fake-ci-pipeline.js';

const ctx = (subcategory?: string, path = '/.travis.yml') => ({
  request: new Request(`http://example.test${path}`),
  path,
  category: 'config-leak' as const,
  subcategory,
});

// Each product's document must be identifiable by a marker only that
// product's schema uses, so a subcategory wired to the wrong body fails.
const products: Array<[string, string, RegExp]> = [
  ['travis-ci', '/.travis.yml', /^language: node_js$/m],
  ['circleci', '/.circleci/config.yml', /^version: 2\.1$/m],
  ['drone-ci', '/.drone.yml', /^kind: pipeline$/m],
  ['bitbucket-pipelines', '/bitbucket-pipelines.yml', /^pipelines:$/m],
  ['buildkite', '/.buildkite/pipeline.yml', /docker-login#v/],
  ['azure-pipelines', '/azure-pipelines.yml', /^ {2}vmImage: ubuntu-latest$/m],
];

describe('fake-ci-pipeline', () => {
  it('serves the product-correct schema for each subcategory', async () => {
    for (const [subcategory, path, marker] of products) {
      const response = fakeCiPipeline(ctx(subcategory, path));
      expect(response.status, subcategory).toBe(200);
      expect(response.headers.get('content-type'), subcategory).toContain('yaml');
      const text = await response.text();
      expect(text, subcategory).toMatch(marker);
    }
  });

  it('gives each product a distinct document', async () => {
    const bodies = await Promise.all(
      products.map(([sub, path]) => fakeCiPipeline(ctx(sub, path)).text()),
    );
    expect(new Set(bodies).size).toBe(products.length);
  });

  it('falls back to a format-valid pipeline for a missing subcategory', async () => {
    const text = await fakeCiPipeline(ctx(undefined)).text();
    expect(text).toMatch(/^language: node_js$/m);
    const unknown = await fakeCiPipeline(ctx('not-a-real-product')).text();
    expect(unknown).toBe(text);
  });

  it('references masked CI variables, never an inlined secret value', async () => {
    for (const [subcategory, path] of products) {
      const text = await fakeCiPipeline(ctx(subcategory, path)).text();
      // Passwords always arrive through the product's secret mechanism.
      expect(text, subcategory).toMatch(
        /\$DOCKER_PASSWORD|\$\(registryPassword\)|from_secret|password-env/,
      );
      // Nothing that reads as a literal credential assignment.
      expect(text, subcategory).not.toMatch(
        /(password|secret|token|api[_-]?key)\s*[:=]\s*["']?[A-Za-z0-9/+]{12,}/i,
      );
    }
  });

  it('uses only non-routable .invalid hosts', async () => {
    for (const [subcategory, path] of products) {
      const text = await fakeCiPipeline(ctx(subcategory, path)).text();
      for (const h of text.match(/https?:\/\/([a-z0-9.-]+)/gi) ?? []) {
        expect(h, subcategory).toContain('.invalid');
      }
      expect(text, subcategory).toContain('registry.internal.invalid');
      // No registrable public TLD anywhere in the document.
      expect(text, subcategory).not.toMatch(/\.(?:com|net|org|io|dev|co\.uk)\b/i);
    }
  });

  it('emits no canary / tracking headers', () => {
    const response = fakeCiPipeline(ctx('travis-ci'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });

  it('never reflects the request path', async () => {
    const clean = await fakeCiPipeline(ctx('drone-ci', '/.drone.yml')).text();
    const dirty = await fakeCiPipeline(ctx('drone-ci', '/<script>/.drone.yml')).text();
    expect(dirty).toBe(clean);
    expect(dirty).not.toContain('<script>');
  });
});
