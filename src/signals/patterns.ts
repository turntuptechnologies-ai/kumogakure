import type { SignalName } from '../types.js';

export interface SignalPattern {
  name: SignalName;
  matchers: RegExp[];
}

export const signalPatterns: SignalPattern[] = [
  { name: 'log4j', matchers: [/\$\{jndi:(ldap|dns|rmi|ldaps|iiop):/i] },
  { name: 'spring4shell', matchers: [/class\.module\.classLoader/i] },
  {
    name: 'sqli',
    matchers: [
      /\bunion\s+select\b/i,
      /\bor\s+1\s*=\s*1\b/i,
      /\bsleep\s*\(/i,
      /'\s*or\s*'\d'\s*=\s*'\d/i,
    ],
  },
  {
    name: 'xss',
    matchers: [/<script\b/i, /<svg\s+onload/i, /javascript:/i, /onerror\s*=/i],
  },
  {
    name: 'path-traversal',
    matchers: [/\.\.\/\.\.\//, /\.\.\\\.\.\\/, /%2e%2e[/\\]/i],
  },
  {
    name: 'cmd-injection',
    matchers: [/[|;`]\s*(whoami|id\b|cat\s+\/etc|uname)/i, /\$\([^)]+\)/, /`[^`]+`/],
  },
  { name: 'xxe', matchers: [/<!DOCTYPE[^>]+ENTITY/i] },
  {
    name: 'ssti',
    matchers: [
      /\{\{\s*\d+\s*\*\s*\d+\s*\}\}/,
      /\$\{\s*\d+\s*\*\s*\d+\s*\}/,
      /<%=\s*\d+\s*\*\s*\d+\s*%>/,
    ],
  },
  { name: 'ssrf-meta', matchers: [/169\.254\.169\.254/, /metadata\.google\.internal/i] },
  {
    name: 'nosqli',
    matchers: [/\$where\b/i, /\$ne\b/i, /\$gt\b/i, /\$regex\b/i, /\$exists\b/i],
  },
  { name: 'ldap-injection', matchers: [/\*\)\(uid=\*/i, /\*\)\(&/i] },
  { name: 'crlf', matchers: [/%0d%0a/i, /\r\n/] },
  { name: 'open-redirect', matchers: [/^\/\/[^/]/, /^\/\\[^\\]/, /https?:\/\/[^/]*@/i] },
];
