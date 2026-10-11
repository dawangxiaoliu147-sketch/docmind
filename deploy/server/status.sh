#!/bin/bash
# 生产状态快照（只读）：回答"改造后现在到底怎么样"
set -uo pipefail
cd /home/admin/docmind/deploy || exit 1

hr() { echo; echo "===== $* ====="; }

hr "1. 容器（关注 PORTS 列）"
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

hr "2. 两个栈的状态"
echo "--- 数据库栈 ---"; docker compose -f 01-db/docker-compose.db.yml ps
echo "--- 应用栈 ---";   docker compose -f 03-app/docker-compose.app.yml ps

hr "3. 端口发布情况（关键）"
echo "docmind-db  : $(docker port docmind-db 2>/dev/null || echo '(空 = 未发布任何端口 ✓)')"
echo "docmind-app : $(docker port docmind-app 2>/dev/null || echo '(空)')"

hr "4. 应用可用性（本机）"
curl -s -o /dev/null -w '  127.0.0.1:3000/api/health -> %{http_code}\n' --max-time 10 http://127.0.0.1:3000/api/health
curl -s -o /dev/null -w '  经 nginx http://127.0.0.1/api/health -> %{http_code}\n' --max-time 10 http://127.0.0.1/api/health
curl -s -o /dev/null -w '  经 nginx 首页 -> %{http_code}\n' --max-time 15 http://127.0.0.1/

hr "5. 数据行数（应与备份清单一致：10/3/5/38）"
docker exec docmind-db psql -U docmind -d docmind -tAc "select 'users=' || count(*) from users"
docker exec docmind-db psql -U docmind -d docmind -tAc "select 'kbs=' || count(*) from knowledge_bases"
docker exec docmind-db psql -U docmind -d docmind -tAc "select 'docs=' || count(*) from documents"
docker exec docmind-db psql -U docmind -d docmind -tAc "select 'chunks=' || count(*) from chunks"

hr "6. 自动更新（cron + 最近日志）"
crontab -l | grep -v '^#' | grep -v '^$'
echo "--- update.log 最近 18 行 ---"
tail -18 /home/admin/update.log 2>/dev/null || echo "(没有日志)"

hr "7. nginx"
systemctl is-active nginx
ls -l /etc/nginx/sites-enabled/

hr "8. 资源"
free -h | head -2
df -h / | tail -1
