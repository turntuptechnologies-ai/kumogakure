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
  // WordPress installation fingerprint: wp-includes/wlwmanifest.xml
  // (the WordPress-generated Windows Live Writer manifest) at any
  // depth — scanners spray subdirectory prefixes to find WP installs.
  // Different ending from the wp-includes/*.php webshell pattern; no
  // overlap (regex-verified).
  {
    pattern: /^\/(?:[^/]+\/)*wp-includes\/wlwmanifest\.xml$/,
    category: 'cms-auth',
    subcategory: 'wordpress-fingerprint',
    template: 'fake-wlwmanifest',
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
  // /backend/.env, ...), not just the web root. This pattern requires
  // the final path segment to be exactly `.env`; named env files like
  // `aws.env` are picked up by the `<name>.env` pattern further down.
  // Root /.env stays on the explicit catalog entry (checked first);
  // root /.env.<x> stays on the pattern above (earlier, first-match
  // wins) — both unchanged.
  {
    pattern: /^\/(?:[^/]+\/)*\.env$/,
    category: 'config-leak',
    subcategory: 'dotenv',
    template: 'fake-env',
  },
  // Vite dev-server internal routes (/@fs/, /@id/, /@vite/) exposed in
  // production are the attack surface of the file-read CVE family
  // (CVE-2025-30208 trailing-separator bypass, CVE-2025-31125
  // ?import+?raw/?inline bypass). Classify as cve-recon rather than the
  // dotenv-variant pattern below that the basename would otherwise hit
  // (e.g. /@fs/.env.test). Template still serves fake-env so the bait
  // remains engaging; query strings (?raw, ?import, ?raw??) are not
  // matched here because routing is path-only.
  {
    pattern: /^\/@(?:fs|id|vite)(?:\/.*)?$/,
    category: 'cve-recon',
    subcategory: 'vite-fs-traversal',
    template: 'fake-env',
  },
  {
    pattern: /^\/(?:[^/]+\/)*\.env\.[^/]+$/,
    category: 'config-leak',
    subcategory: 'dotenv-variant',
    template: 'fake-env',
  },
  // Named env files — a non-empty basename ending in `.env`
  // (aws.env, prod.env, staging.env, ...). Distinct from the bare
  // `.env` patterns above; verified not to match `/.env`,
  // `/.env.production`, or `.env-config.js`.
  {
    pattern: /^\/(?:[^/]+\/)*[^/]+\.env$/,
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
  // phpinfo() enumeration: a curated allowlist of the basenames
  // scanners spray, at any directory depth. Generic names like
  // index.php / contact.php are deliberately excluded; wp-content
  // and wp-includes .php stay webshell via the earlier patterns
  // (first-match wins).
  {
    pattern:
      /^\/(?:[^/]+\/)*(?:phpinfo|_phpinfo|old_phpinfo|phpversion|php-info|php_info|php|pinfo|pi|p|i|info|test|debug|server-status|server_status|server-info|server_info)\.php$/,
    category: 'config-leak',
    subcategory: 'phpinfo',
    template: 'phpinfo',
  },
  {
    pattern: /^\/(?:[^/]+\/)*(?:phpinfo|php-info|info)$/,
    category: 'config-leak',
    subcategory: 'phpinfo',
    template: 'phpinfo',
  },
  // Git home-dir dotfiles at any depth (/root/, /home/<user>/, web
  // root). Distinct from the .git/ repo family below; final segment
  // must be exactly the dotfile name. .git-credentials is split to its
  // own subcategory — plaintext credential theft is a higher-severity
  // signal worth isolating in the daily_stats rollups.
  {
    pattern: /^\/(?:[^/]+\/)*\.gitconfig$/,
    category: 'config-leak',
    subcategory: 'git',
    template: 'fake-gitconfig',
  },
  {
    pattern: /^\/(?:[^/]+\/)*\.git-credentials$/,
    category: 'config-leak',
    subcategory: 'git-credentials',
    template: 'fake-git-credentials',
  },
  // Cloud credential/config dotfiles at any depth. Same severity split
  // as the git family: plaintext credential stores
  // (.aws/credentials, .s3cfg, .boto) go to `cloud-credentials`;
  // .aws/config is structural so it stays `aws`. The old exact
  // /.aws/credentials catalog entry was removed in favour of these.
  {
    pattern: /^\/(?:[^/]+\/)*\.aws\/credentials$/,
    category: 'config-leak',
    subcategory: 'cloud-credentials',
    template: 'fake-aws-credentials',
  },
  {
    pattern: /^\/(?:[^/]+\/)*\.s3cfg$/,
    category: 'config-leak',
    subcategory: 'cloud-credentials',
    template: 'fake-s3cfg',
  },
  {
    pattern: /^\/(?:[^/]+\/)*\.boto$/,
    category: 'config-leak',
    subcategory: 'cloud-credentials',
    template: 'fake-boto',
  },
  {
    pattern: /^\/(?:[^/]+\/)*\.aws\/config$/,
    category: 'config-leak',
    subcategory: 'aws',
    template: 'fake-aws-config',
  },
  // .netrc / _netrc (Windows): plaintext auto-login store for curl /
  // wget / git-over-HTTPS / ftp. Same credential-theft class as the
  // git/cloud stores; any depth, final segment exact.
  {
    pattern: /^\/(?:[^/]+\/)*[._]netrc$/,
    category: 'config-leak',
    subcategory: 'netrc',
    template: 'fake-netrc',
  },
  // Package-registry publish credentials -> supply-chain. .npmrc
  // carries the npm _authToken; .pypirc the PyPI API token. One shared
  // subcategory (the supply-chain token-theft signal); any depth,
  // final segment exact.
  {
    pattern: /^\/(?:[^/]+\/)*\.npmrc$/,
    category: 'config-leak',
    subcategory: 'package-registry-credentials',
    template: 'fake-npmrc',
  },
  {
    pattern: /^\/(?:[^/]+\/)*\.pypirc$/,
    category: 'config-leak',
    subcategory: 'package-registry-credentials',
    template: 'fake-pypirc',
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
  // Git repo metadata (distinct from credentials). The bare .git/
  // directory index leads on to the existing fake .git/config &
  // .git/HEAD. These are anchored so they do not shadow the
  // /.git/<file> pattern below (regex-verified).
  {
    pattern: /^\/(?:[^/]+\/)*\.git\/?$/,
    category: 'config-leak',
    subcategory: 'git',
    template: 'fake-git-dir-listing',
  },
  {
    pattern: /^\/(?:[^/]+\/)*\.gitignore$/,
    category: 'config-leak',
    subcategory: 'git',
    template: 'fake-gitignore',
  },
  {
    pattern: /^\/(?:[^/]+\/)*\.gitattributes$/,
    category: 'config-leak',
    subcategory: 'git',
    template: 'fake-gitattributes',
  },
  {
    pattern: /^\/(?:[^/]+\/)*\.gitmodules$/,
    category: 'config-leak',
    subcategory: 'git',
    template: 'fake-gitmodules',
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
