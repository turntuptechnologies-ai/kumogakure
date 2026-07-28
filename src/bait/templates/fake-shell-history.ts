import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for a served shell history file — `.bash_history`,
// `.zsh_history`, `.mysql_history`, and siblings. The higher-value half of
// the home-directory dotfile family: an rc file discloses what an operator
// configured, a history file discloses what they actually ran, including the
// passwords they typed on a command line and the hosts they typed them at
// (CWE-200 / CWE-532).
//
// Shaped as a plausible operator session — a database restore, a certificate
// renewal, some log triage — because the *narrative* is what makes a scanner
// keep reading. Every credential typed in it is the non-actionable
// placeholder, every host is `.invalid`, and the account and instance names
// are invented. Fully static; never reflects the request.

const body = `cd /srv/www/app
git pull --ff-only
npm ci --omit=dev
npm run build
sudo systemctl restart app
sudo journalctl -u app -n 200 --no-pager
curl -fsS https://app.example.invalid/healthz
df -h
du -sh /var/log/*
sudo truncate -s 0 /var/log/app/error.log
mysql -h db.internal.invalid -u app_user -pREDACTED_FOR_HONEYPOT app_production
mysqldump -h db.internal.invalid -u app_user -pREDACTED_FOR_HONEYPOT app_production > /tmp/backup.sql
gzip /tmp/backup.sql
scp /tmp/backup.sql.gz deploy@backup-01.internal.invalid:/srv/backups/
rm -f /tmp/backup.sql.gz
export PGPASSWORD=REDACTED_FOR_HONEYPOT
psql -h db.internal.invalid -U app_user -d app_production -c 'select count(*) from users;'
unset PGPASSWORD
aws s3 ls s3://example-honeypot-bucket/uploads/ --profile production
aws sts get-caller-identity --profile production
docker login -u ci-publisher registry.internal.invalid
docker compose pull
docker compose up -d
docker image prune -f
kubectl --namespace production get pods
kubectl --namespace production rollout restart deployment/app
kubectl --namespace production logs deployment/app --tail=100
ssh -i ~/.ssh/id_ed25519_deploy deploy@app-02.internal.invalid
sudo certbot renew --dry-run
sudo nginx -t
sudo systemctl reload nginx
crontab -l
history | grep mysql
vim ~/.bashrc
source ~/.bashrc
exit
`;

export const fakeShellHistory: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
  });
};
