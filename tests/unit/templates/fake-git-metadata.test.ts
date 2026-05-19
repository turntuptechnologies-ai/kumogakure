import { describe, expect, it } from 'vitest';
import { fakeGitattributes } from '../../../src/bait/templates/fake-gitattributes.js';
import { fakeGitignore } from '../../../src/bait/templates/fake-gitignore.js';
import { fakeGitmodules } from '../../../src/bait/templates/fake-gitmodules.js';

const ctx = (path: string) => ({
  request: new Request(`http://example.test${path}`, { method: 'GET' }),
  path,
  category: 'config-leak' as const,
  subcategory: 'git',
});

describe('fake-gitignore template', () => {
  it('serves a 200 plaintext gitignore', async () => {
    const res = fakeGitignore(ctx('/.gitignore'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/plain');
    expect(await res.text()).toContain('node_modules/');
  });
});

describe('fake-gitattributes template', () => {
  it('serves a 200 plaintext gitattributes', async () => {
    const res = fakeGitattributes(ctx('/.gitattributes'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/plain');
    expect(await res.text()).toContain('text=auto');
  });
});

describe('fake-gitmodules template', () => {
  it('serves a 200 plaintext gitmodules with .invalid submodule URLs', async () => {
    const res = fakeGitmodules(ctx('/.gitmodules'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/plain');
    const body = await res.text();
    expect(body).toContain('[submodule "libs/shared"]');
    for (const line of body.split('\n').filter((l) => l.trim().startsWith('url = '))) {
      expect(line).toContain('.invalid');
    }
  });

  it('emits no honeypot canary header', () => {
    for (const [k] of fakeGitmodules(ctx('/.gitmodules')).headers.entries()) {
      expect(k.toLowerCase()).not.toContain('honeypot');
    }
  });
});
