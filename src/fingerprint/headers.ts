import type { BaitCategory } from '../types.js';

const serverHeaderPool: Record<BaitCategory, string[]> = {
  'cms-auth': ['Apache/2.4.41 (Ubuntu)', 'Apache/2.4.52 (Debian)', 'nginx/1.18.0'],
  'config-leak': ['Apache/2.4.41 (Ubuntu)', 'nginx/1.20.1'],
  'cve-recon': ['nginx/1.18.0', 'Microsoft-IIS/10.0'],
  'ssrf-bait': ['EC2ws'],
  webshell: ['Apache/2.4.41 (Ubuntu)'],
  'api-recon': ['nginx/1.18.0'],
  'iot-recon': ['lighttpd/1.4.39', 'Boa/0.94.14rc21'],
  'mcp-recon': ['uvicorn', 'nginx/1.25.3'],
  unknown: ['nginx/1.18.0'],
};

function unbiasedIndex(n: number): number {
  // Rejection sampling: discard the non-uniform tail of the 2^32 range
  // so every index is equally likely (js/biased-cryptographic-random).
  const limit = Math.floor(0x1_0000_0000 / n) * n;
  const buf = new Uint32Array(1);
  let x: number;
  do {
    x = crypto.getRandomValues(buf)[0];
  } while (x >= limit);
  return x % n;
}

export function fingerprintHeaders(category: BaitCategory): Record<string, string> {
  const pool = serverHeaderPool[category];
  const idx = unbiasedIndex(pool.length);
  const server = pool[idx] ?? 'nginx/1.18.0';
  const headers: Record<string, string> = { Server: server };
  if (category === 'cms-auth' || category === 'config-leak' || category === 'webshell') {
    headers['X-Powered-By'] = 'PHP/7.4.3';
  }
  return headers;
}
