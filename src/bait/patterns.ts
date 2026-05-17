import type { PatternEntry } from '../types.js';

export const patternBait: PatternEntry[] = [
  {
    pattern: /^\/wp-content\/.+\.(php|phtml)$/,
    category: 'webshell',
    subcategory: 'wp-content',
    template: 'not-found',
  },
  {
    pattern: /^\/wp-includes\/.+\.php$/,
    category: 'webshell',
    subcategory: 'wp-includes',
    template: 'not-found',
  },
  {
    pattern: /^\/.*\.(bak|swp|old|orig|save|backup)$/,
    category: 'config-leak',
    subcategory: 'backup',
    template: 'not-found',
  },
  {
    pattern: /^\/\.env\..+$/,
    category: 'config-leak',
    subcategory: 'dotenv-variant',
    template: 'fake-env',
  },
  // Scanners spray `.env` across many directories (/api/.env,
  // /backend/.env, ...), not just the web root. The final path segment
  // must be exactly `.env` or `.env.<suffix>` so paths like /foo.env
  // or /environment are not misclassified. Root /.env stays on the
  // explicit catalog entry (checked first); root /.env.<x> stays on the
  // pattern above (earlier, first-match wins) — both unchanged.
  {
    pattern: /^\/(?:[^/]+\/)*\.env$/,
    category: 'config-leak',
    subcategory: 'dotenv',
    template: 'fake-env',
  },
  {
    pattern: /^\/(?:[^/]+\/)*\.env\.[^/]+$/,
    category: 'config-leak',
    subcategory: 'dotenv-variant',
    template: 'fake-env',
  },
  // MCP servers (JSON-RPC 2.0 over the Streamable HTTP transport) are
  // mounted at varied paths; scanners enumerate the common ones. /mcp
  // itself is the explicit catalog entry (checked first); these cover
  // the rest. /jsonrpc is generic JSON-RPC but routed here too — the
  // template returns a JSON-RPC error for non-MCP bodies.
  {
    pattern: /^\/(?:jsonrpc|sse|messages)$/,
    category: 'mcp-recon',
    subcategory: 'mcp',
    template: 'mcp',
  },
  {
    pattern: /^\/(?:api\/)?mcp(?:\/.*)?$/,
    category: 'mcp-recon',
    subcategory: 'mcp',
    template: 'mcp',
  },
  {
    pattern: /^\/cgi-bin\/.+/,
    category: 'cve-recon',
    subcategory: 'cgi',
    template: 'not-found',
  },
  {
    pattern: /^\/.*(shell|c99|r57|wso)\.[a-z]+$/,
    category: 'webshell',
    subcategory: 'named-shell',
    template: 'not-found',
  },
  {
    pattern: /^\/\.git\/.+/,
    category: 'config-leak',
    subcategory: 'git',
    template: 'not-found',
  },
  {
    pattern: /^\/_search.*/,
    category: 'cve-recon',
    subcategory: 'elasticsearch',
    template: 'not-found',
  },
  {
    pattern: /^\/console\/.+/,
    category: 'cve-recon',
    subcategory: 'weblogic',
    template: 'not-found',
  },
  {
    pattern: /^\/actuator\/.+/,
    category: 'cve-recon',
    subcategory: 'spring',
    template: 'spring-actuator-generic',
  },
];

export function findPatternBait(path: string): PatternEntry | undefined {
  return patternBait.find((entry) => entry.pattern.test(path));
}
