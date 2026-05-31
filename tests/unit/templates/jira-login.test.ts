import { describe, expect, it } from 'vitest';
import { jiraLogin } from '../../../src/bait/templates/jira-login.js';

const ctx = (path: string, method = 'GET') => ({
  request: new Request(`http://example.test${path}`, { method }),
  path,
  category: 'cms-auth' as const,
  subcategory: 'atlassian-jira',
});

describe('jira-login', () => {
  it('renders a Jira login form with the os_username/os_password fields', async () => {
    const response = jiraLogin(ctx('/secure/Dashboard.jspa'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    const html = await response.text();
    expect(html).toContain('name="os_username"');
    expect(html).toContain('name="os_password"');
    expect(html).toContain('action="/login.jsp"');
  });

  it('sets the X-AUSERNAME: anonymous header real Jira returns when unauthenticated', () => {
    const response = jiraLogin(ctx('/secure/Dashboard.jspa'));
    expect(response.headers.get('x-ausername')).toBe('anonymous');
  });

  it('shows the incorrect-credentials state on POST', async () => {
    const get = await jiraLogin(ctx('/login.jsp', 'GET')).text();
    expect(get).not.toContain('incorrect');
    const post = await jiraLogin(ctx('/login.jsp', 'POST')).text();
    expect(post).toContain('incorrect');
  });

  it('emits no canary / tracking headers', () => {
    const response = jiraLogin(ctx('/secure/Dashboard.jspa'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
