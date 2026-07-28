import { describe, expect, it } from 'vitest';
import { fakeJenkinsfile } from '../../../src/bait/templates/fake-jenkinsfile.js';

const ctx = () => ({
  request: new Request('http://example.test/Jenkinsfile'),
  path: '/Jenkinsfile',
  category: 'config-leak' as const,
  subcategory: 'jenkins',
});

describe('fake-jenkinsfile', () => {
  it('serves a declarative Groovy pipeline as text', async () => {
    const response = fakeJenkinsfile(ctx());
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    const text = await response.text();
    expect(text).toMatch(/^pipeline \{$/m);
    expect(text).toMatch(/^\s+agent \{$/m);
    expect(text).toMatch(/^\s+stages \{$/m);
    for (const stage of ['Checkout', 'Build', 'Test', 'Publish', 'Deploy']) {
      expect(text, stage).toContain(`stage('${stage}')`);
    }
  });

  it('pulls secrets through the credentials binding, not as literals', async () => {
    const text = await fakeJenkinsfile(ctx()).text();
    expect(text).toContain("credentials('internal-registry')");
    expect(text).toContain("credentialsId: 'prod-kubeconfig'");
    expect(text).not.toMatch(
      /(password|secret|token|api[_-]?key)\s*[:=]\s*["']?[A-Za-z0-9/+]{12,}/i,
    );
  });

  it('uses only non-routable .invalid hosts', async () => {
    const text = await fakeJenkinsfile(ctx()).text();
    for (const h of text.match(/https?:\/\/([a-z0-9.-]+)/gi) ?? []) {
      expect(h).toContain('.invalid');
    }
    for (const e of text.match(/[a-z0-9._-]+@[a-z0-9.-]+/gi) ?? []) {
      expect(e).toMatch(/\.invalid$/);
    }
    expect(text).not.toMatch(/\.(?:com|net|org|io|dev|co\.uk)\b/i);
  });

  it('emits no canary / tracking headers', () => {
    const response = fakeJenkinsfile(ctx());
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });

  it('never reflects the request path', async () => {
    const clean = await fakeJenkinsfile(ctx()).text();
    const dirty = await fakeJenkinsfile({
      ...ctx(),
      request: new Request('http://example.test/<script>/Jenkinsfile'),
      path: '/<script>/Jenkinsfile',
    }).text();
    expect(dirty).toBe(clean);
    expect(dirty).not.toContain('<script>');
  });
});
