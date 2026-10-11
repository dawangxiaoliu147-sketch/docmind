#!/usr/bin/env bash
# ASCII labels only, so the output survives any console codepage.
set -uo pipefail

hr() { echo; echo "===== $* ====="; }

hr "1. compose project dir"
docker inspect docmind-app-1 --format 'workdir={{index .Config.Labels "com.docker.compose.project.working_dir"}}'
docker inspect docmind-app-1 --format 'config_files={{index .Config.Labels "com.docker.compose.project.config_files"}}'
docker inspect docmind-app-1 --format 'project={{index .Config.Labels "com.docker.compose.project"}}'
docker compose ls -a 2>/dev/null

hr "2. compose files found"
for d in /root /opt /srv /home; do
  [ -d "$d" ] || continue
  find "$d" -maxdepth 3 \( -name "docker-compose*.yml" -o -name "compose*.yml" \) 2>/dev/null
done | sort -u

hr "3. is there automation? (cron / timers / watchtower)"
echo "--- root crontab ---"; crontab -l 2>/dev/null || echo "(none)"
echo "--- /etc/cron.d ---"; ls -1 /etc/cron.d 2>/dev/null || true
echo "--- systemd timers ---"; systemctl list-timers --all --no-pager 2>/dev/null | head -15
echo "--- containers with watchtower in name/image ---"
docker ps -a --format '{{.Names}} {{.Image}}' | grep -i -E 'watch|auto|pull' || echo "(none)"

hr "4. images on this host"
docker images --format '{{.Repository}}:{{.Tag}}  {{.CreatedSince}}  {{.Size}}'

hr "5. nginx"
nginx -v 2>&1 || echo "nginx not installed"
systemctl is-active nginx 2>/dev/null || true
ls -1 /etc/nginx/sites-enabled/ 2>/dev/null || echo "(no sites-enabled)"
ls -1 /etc/nginx/conf.d/ 2>/dev/null || true

hr "6. firewall"
ufw status verbose 2>/dev/null || echo "(no ufw)"
echo "--- DOCKER-USER ---"; iptables -S DOCKER-USER 2>/dev/null || echo "(cannot read)"
echo "--- listening sockets ---"; ss -tlnp 2>/dev/null | head -20

hr "7. app healthcheck: run it by hand"
docker exec docmind-app-1 sh -c 'wget -qO- http://localhost:3000/api/health; echo "  wget_exit=$?"' 2>&1 | tail -3
echo "--- healthcheck definition ---"
docker inspect docmind-app-1 --format '{{json .Config.Healthcheck}}'
echo "--- last healthcheck output ---"
docker inspect docmind-app-1 --format '{{range .State.Health.Log}}{{.ExitCode}}|{{.Output}}{{end}}' 2>/dev/null | head -c 400; echo

hr "8. database size and rows"
docker exec docmind-db psql -U docmind -d docmind -tAc "select version();"
docker exec docmind-db psql -U docmind -d docmind -tAc "select 'db_size=' || pg_size_pretty(pg_database_size('docmind'));"
docker exec docmind-db psql -U docmind -d docmind -tAc "select 'users=' || count(*) from users;"
docker exec docmind-db psql -U docmind -d docmind -tAc "select 'kbs=' || count(*) from knowledge_bases;"
docker exec docmind-db psql -U docmind -d docmind -tAc "select 'docs=' || count(*) from documents;"
docker exec docmind-db psql -U docmind -d docmind -tAc "select 'chunks=' || count(*) from chunks;"
docker exec docmind-db psql -U docmind -d docmind -tAc "select 'tables=' || count(*) from information_schema.tables where table_schema='public';"

hr "9. env key names only (no values)"
for f in /root/docmind/.env /root/.env /opt/docmind/.env /srv/docmind/.env; do
  if [ -f "$f" ]; then
    echo "--- $f ---"
    grep -oE '^[A-Za-z_][A-Za-z0-9_]*' "$f" | sort | tr '\n' ' '
    echo
  fi
done

hr "10. resources"
free -h
df -h / /var/lib/docker 2>/dev/null | head -5
echo "--- docker system df ---"; docker system df 2>/dev/null

hr "11. external IP config"
ip -4 addr show scope global 2>/dev/null | grep -E 'inet ' || true
