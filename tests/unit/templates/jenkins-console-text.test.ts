import { describe, expect, it } from 'vitest';
import { jenkinsConsoleText } from '../../../src/bait/templates/jenkins-console-text.js';

const ctx = (path: string) => ({
  request: new Request(`http://example.test${path}`),
  path,
  category: 'config-leak' as const,
  subcategory: 'jenkins',
});

describe('jenkins-console-text', () => {
  it('returns a plain-text Jenkins build log', async () => {
    const response = jenkinsConsoleText(ctx('/job/prod/lastBuild/consoleText'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    const text = await response.text();
    expect(text).toMatch(/^Started by /);
    expect(text.trimEnd()).toMatch(/Finished: SUCCESS$/);
  });

  it('masks credentials and uses only .invalid hosts', async () => {
    const text = await jenkinsConsoleText(ctx('/job/prod/lastBuild/consoleText')).text();
    expect(text).toContain('****');
    for (const [host] of text.matchAll(
      /[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:invalid|com|net|org|io)\b/g,
    )) {
      expect(host).toMatch(/\.invalid$/);
    }
  });

  it('does not reflect the job name from the URL', async () => {
    const text = await jenkinsConsoleText(ctx('/job/zz-probe-job/lastBuild/consoleText')).text();
    expect(text).not.toContain('zz-probe-job');
  });

  it('emits no canary / tracking headers', () => {
    const response = jenkinsConsoleText(ctx('/job/prod/lastBuild/consoleText'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
