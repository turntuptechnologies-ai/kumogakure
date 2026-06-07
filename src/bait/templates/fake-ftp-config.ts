import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for the broad FTP/SFTP deploy-credential config sweep:
// scanners spray dozens of naming/extension variants of an FTP or SFTP
// config file (`sftp.json`, `ftp-config.yml`, `sftp.config.js`,
// `ftp.ini`, `.ftpconfig`, `sftp.json.dist`, `ftp.prod.json`, …) hunting
// for a deploy target's host/username/password in cleartext. Same
// credential-theft class as the VS Code `.vscode/sftp.json` decoy (whose
// fabricated values this reuses for a coherent story across both), but
// not editor-specific — hence the broader `ftp-credentials` subcategory.
//
// The response is rendered in the format the requested extension implies
// (JSON / YAML / XML / INI / JS / text) so a scanner that asked for
// `.yml` doesn't get JSON back. All values are fabricated; password /
// passphrase / key path are `REDACTED_FOR_HONEYPOT`. Format is chosen by
// the path's extension suffix only — the path is never reflected into the
// body.

const HOST = 'deploy.example.invalid';
const USER = 'deploy';
const SECRET = 'REDACTED_FOR_HONEYPOT';
const REMOTE = '/var/www/html';

const jsonBody = JSON.stringify(
  {
    name: 'production',
    host: HOST,
    protocol: 'sftp',
    port: 22,
    username: USER,
    password: SECRET,
    privateKeyPath: SECRET,
    passphrase: SECRET,
    remotePath: REMOTE,
    uploadOnSave: true,
  },
  null,
  2,
);

const yamlBody = `name: production
host: ${HOST}
protocol: sftp
port: 22
username: ${USER}
password: ${SECRET}
privateKeyPath: ${SECRET}
remotePath: ${REMOTE}
`;

const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <name>production</name>
  <host>${HOST}</host>
  <protocol>sftp</protocol>
  <port>22</port>
  <username>${USER}</username>
  <password>${SECRET}</password>
  <remotePath>${REMOTE}</remotePath>
</configuration>
`;

const iniBody = `[production]
host = ${HOST}
protocol = sftp
port = 22
username = ${USER}
password = ${SECRET}
remote_path = ${REMOTE}
`;

const jsBody = `module.exports = {
  name: "production",
  host: "${HOST}",
  protocol: "sftp",
  port: 22,
  username: "${USER}",
  password: "${SECRET}",
  remotePath: "${REMOTE}"
};
`;

const textBody = `name=production
host=${HOST}
protocol=sftp
port=22
username=${USER}
password=${SECRET}
remote_path=${REMOTE}
`;

interface Rendered {
  body: string;
  type: string;
}

const jsonResp: Rendered = { body: jsonBody, type: 'application/json; charset=UTF-8' };

function render(path: string): Rendered {
  const p = path.toLowerCase();
  if (p.endsWith('.yml') || p.endsWith('.yaml')) {
    return { body: yamlBody, type: 'application/x-yaml; charset=UTF-8' };
  }
  if (p.endsWith('.xml')) return { body: xmlBody, type: 'application/xml; charset=UTF-8' };
  if (p.endsWith('.ini') || p.endsWith('.conf')) {
    return { body: iniBody, type: 'text/plain; charset=UTF-8' };
  }
  if (p.endsWith('.js')) return { body: jsBody, type: 'application/javascript; charset=UTF-8' };
  if (p.endsWith('.txt')) return { body: textBody, type: 'text/plain; charset=UTF-8' };
  // .json, .json.<suffix>, bare names, dotfiles and .config → JSON
  return jsonResp;
}

export const fakeFtpConfig: TemplateFn = (ctx) => {
  const { body, type } = render(ctx.path);
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': type },
  });
};
