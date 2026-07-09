import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for a path-traversal / LFI probe that resolves to
// `/etc/passwd` — currently reached via the Nextcloud AppAPI exApp proxy
// `get_log_file` endpoint (a documented arbitrary-file-read: the log path
// is not sanitised, so `..%252f`-style traversal escapes to any file).
// Serving a believable `/etc/passwd` makes the attacker think the read
// succeeded and keep interacting (which we capture), while leaking nothing
// real: `/etc/passwd` never holds passwords (the `x` fields are hashes in
// the unreadable `/etc/shadow`). Plausible Debian user table for a host
// running a web app + MySQL + Redis. Fully static; never reflects input.

const body = `root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
bin:x:2:2:bin:/bin:/usr/sbin/nologin
sys:x:3:3:sys:/dev:/usr/sbin/nologin
sync:x:4:65534:sync:/bin:/bin/sync
games:x:5:60:games:/usr/games:/usr/sbin/nologin
man:x:6:12:man:/var/cache/man:/usr/sbin/nologin
mail:x:8:8:mail:/var/mail:/usr/sbin/nologin
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
backup:x:34:34:backup:/var/backups:/usr/sbin/nologin
nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin
systemd-network:x:100:102:systemd Network Management,,,:/run/systemd:/usr/sbin/nologin
messagebus:x:103:106::/nonexistent:/usr/sbin/nologin
sshd:x:104:65534::/run/sshd:/usr/sbin/nologin
mysql:x:105:110:MySQL Server,,,:/nonexistent:/bin/false
redis:x:106:112::/var/lib/redis:/usr/sbin/nologin
deploy:x:1000:1000:deploy:/home/deploy:/bin/bash
`;

export const fakeEtcPasswd: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
  });
};
