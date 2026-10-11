#!/bin/bash
# 紧急体检：站点为什么不通（只读）
set -uo pipefail
hr() { echo; echo "===== $* ====="; }

hr "1. 容器状态"
docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

hr "2. 本机自测（绕过外网，最权威）"
echo -n "nginx 80  -> "; curl -s -o /dev/null -w '%{http_code}\n' --max-time 8 http://127.0.0.1/api/health
echo -n "app 3000  -> "; curl -s -o /dev/null -w '%{http_code}\n' --max-time 8 http://127.0.0.1:3000/api/health
echo "nginx 服务: $(systemctl is-active nginx 2>/dev/null)"

hr "3. 应用日志尾部（找崩溃原因）"
docker logs --tail 40 docmind-app 2>&1 | tail -40

hr "4. migrate 日志"
docker logs --tail 25 docmind-migrate 2>&1 | tail -25

hr "5. 新字段是否已迁移到生产库"
docker exec docmind-db psql -U docmind -d docmind -tAc "select column_name from information_schema.columns where table_name='jobs' and column_name in ('source','source_id','apply_email') order by 1"

hr "6. 最近的自动更新日志（cron 有没有在换镜像）"
tail -25 /home/admin/update.log 2>/dev/null

hr "7. 磁盘与内存（会不会是 OOM / 写满）"
free -h | head -2
df -h / | tail -1
docker system df 2>/dev/null | head -5
