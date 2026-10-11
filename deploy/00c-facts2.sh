#!/usr/bin/env bash
# ASCII labels only.
set -uo pipefail
hr() { echo; echo "===== $* ====="; }

hr "1. the 5-minute auto-update script"
echo "--- /home/admin/update.sh ---"
cat /home/admin/update.sh 2>&1 || echo "(not found)"

hr "2. update.log tail"
tail -40 /home/admin/update.log 2>&1 || echo "(no log)"

hr "3. repo state"
cd /home/admin/docmind 2>/dev/null || { echo "cannot cd"; exit 0; }
git remote -v 2>&1
git rev-parse --abbrev-ref HEAD 2>&1
git log --oneline -5 2>&1
echo "--- status (first 20) ---"
git status --porcelain 2>&1 | head -20
echo "--- upstream diff ---"
git rev-list --left-right --count origin/main...HEAD 2>&1

hr "4. dir listing (top level)"
ls -la /home/admin/docmind | head -30
echo "--- owner/group of repo ---"
stat -c '%U:%G %a %n' /home/admin/docmind /home/admin/docmind/docker-compose.yml 2>&1

hr "5. .env keys only"
if [ -f /home/admin/docmind/.env ]; then
  grep -oE '^[A-Za-z_][A-Za-z0-9_]*' /home/admin/docmind/.env | sort | tr '\n' ' '; echo
  echo "--- COOKIE_SECURE / DATABASE_URL presence (values masked) ---"
  grep -E '^(COOKIE_SECURE|DATABASE_URL)=' /home/admin/docmind/.env | sed -E 's/(DATABASE_URL=).*/\1<masked>/'
else
  echo "(.env not found in repo dir)"
fi

hr "6. healthcheck hypothesis: IPv6 vs IPv4 inside the container"
docker exec docmind-app-1 sh -c 'wget -qO- http://localhost:3000/api/health 2>&1 | head -2; echo "  localhost_exit=$?"'
docker exec docmind-app-1 sh -c 'wget -qO- http://127.0.0.1:3000/api/health 2>&1 | head -2; echo "  127.0.0.1_exit=$?"'
echo "--- listening sockets inside app container ---"
docker exec docmind-app-1 sh -c 'netstat -tln 2>/dev/null || cat /proc/net/tcp | head -5' 2>&1 | head -12
echo "--- /etc/hosts inside app container ---"
docker exec docmind-app-1 cat /etc/hosts 2>&1 | head -6

hr "7. is the site actually serving right now (from the host)"
curl -s -o /dev/null -w 'localhost:3000  http=%{http_code}\n' --max-time 8 http://127.0.0.1:3000/api/health
curl -s --max-time 8 http://127.0.0.1:3000/api/health; echo

hr "8. security group cannot be read from inside; note public IP"
curl -s --max-time 5 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "(no metadata access)"
echo
