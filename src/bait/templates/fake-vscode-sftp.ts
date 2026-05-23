import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for VS Code SFTP extension configs at `.vscode/sftp.json`.
// The community extensions (e.g. liximomo/vscode-sftp, Natizyskunk fork)
// persist deploy-target credentials in this file — host, username,
// password, privateKeyPath, passphrase — so a fetched real config is
// a direct credential-theft payload. Same severity class as
// .aws/credentials / .git-credentials / .npmrc. All values fabricated;
// password / passphrase / private-key path are `REDACTED_FOR_HONEYPOT`.

const body = JSON.stringify(
  {
    name: 'production',
    host: 'deploy.example.invalid',
    protocol: 'sftp',
    port: 22,
    username: 'deploy',
    password: 'REDACTED_FOR_HONEYPOT',
    privateKeyPath: 'REDACTED_FOR_HONEYPOT',
    passphrase: 'REDACTED_FOR_HONEYPOT',
    remotePath: '/var/www/html',
    uploadOnSave: true,
    useTempFile: false,
    openSsh: false,
    ignore: ['.vscode', '.git', '.DS_Store', 'node_modules'],
  },
  null,
  2,
);

export const fakeVscodeSftp: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
  });
};
