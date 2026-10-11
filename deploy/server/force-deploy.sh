#!/bin/bash
# 强制完成一次部署：
#   1) 先停 cron —— 每 5 分钟起一个新的 pull 会互相抢带宽，导致谁都拉不完（实测踩到）
#   2) 前台把镜像拉完并重启
#   3) 报告状态
# cron 的恢复由 restore-cron.sh 负责。
set -uo pipefail
cd /home/admin/docmind || exit 1
APP_STACK=deploy/03-app/docker-compose.app.yml

echo "=== 1) 停 cron ==="
crontab -l > "/root/crontab.before-forcedeploy.$(date +%s).bak" 2>/dev/null || true
crontab -l 2>/dev/null | sed -E 's#^([^#].*update\.sh.*)$#\#FORCEDEPLOY_DISABLED \1#' | crontab -
crontab -l | tail -2

echo
echo "=== 2) 拉镜像（前台，可能要几分钟）==="
time docker compose -f "$APP_STACK" pull

echo
echo "=== 3) 起新版本（migrate → app）==="
docker compose -f "$APP_STACK" up -d
sleep 10

echo
echo "=== 4) 状态 ==="
docker compose -f "$APP_STACK" ps
echo "--- migrate 尾部 ---"
docker logs --tail 8 docmind-migrate 2>&1
echo "--- 新路由（401=新版已上线）---"
echo -n "/api/jobs/sync -> "; curl -s -o /dev/null -w '%{http_code}\n' --max-time 8 http://127.0.0.1/api/jobs/sync
echo -n "首页 -> "; curl -s -o /dev/null -w '%{http_code}\n' --max-time 10 http://127.0.0.1/

echo
echo "=== 5) 新字段与示例标记 ==="
docker exec docmind-db psql -U docmind -d docmind -tAc "select '新列数=' || count(*) from information_schema.columns where table_name='jobs' and column_name in ('source','source_id','apply_email')"
docker exec docmind-db psql -U docmind -d docmind -tAc "select coalesce(source,'(null)') || ' = ' || count(*) from jobs group by source order by 2 desc"
