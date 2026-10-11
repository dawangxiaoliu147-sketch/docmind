#!/bin/bash
# 收尾部署：清理堆积的 pull，然后**单次**前台拉完并重启。
#
# 背景：这台机器拉 1.7GB 镜像要十几分钟，而 cron 每 5 分钟起一轮；没有互斥锁时
# 会堆出多个并发 pull 互相抢带宽，谁都拉不完。所以先杀干净，再单独跑一次。
# （update.sh 已加 flock 互斥，恢复 cron 后不会再发生。）
set -uo pipefail
cd /home/admin/docmind || exit 1
APP_STACK=deploy/03-app/docker-compose.app.yml

echo "=== 1) 杀掉所有堆积的 pull ==="
pkill -f "compose -f deploy/03-app/docker-compose.app.yml pull" 2>/dev/null || true
sleep 3
if ps -eo pid,cmd | grep "[c]ompose -f deploy" >/dev/null; then
  echo "还有残留，再杀一次"; pkill -9 -f "compose -f deploy" 2>/dev/null || true; sleep 2
fi
ps -eo pid,etime,cmd | grep "[c]ompose -f deploy" || echo "✓ 已无 pull 进程"
echo "负载: $(cut -d' ' -f1-3 /proc/loadavg)"

echo
echo "=== 2) 单次前台 pull（内容库已有部分进度，应该快很多）==="
START=$(date +%s)
docker compose -f "$APP_STACK" pull
echo "pull 用时 $(( $(date +%s) - START )) 秒"

echo
echo "=== 3) 起新版本 ==="
docker compose -f "$APP_STACK" up -d
sleep 12

echo
echo "=== 4) 验证 ==="
docker compose -f "$APP_STACK" ps
echo "--- migrate 尾部 ---"
docker logs --tail 12 docmind-migrate 2>&1
echo -n "/api/jobs/sync -> "; curl -s -o /dev/null -w '%{http_code}\n' --max-time 8 http://127.0.0.1/api/jobs/sync
echo -n "首页 -> "; curl -s -o /dev/null -w '%{http_code}\n' --max-time 10 http://127.0.0.1/
echo "--- 镜像现在是哪个 ---"
docker image inspect ghcr.io/dawangxiaoliu147-sketch/docmind:latest --format '{{.Created}}'

echo
echo "=== 5) 新字段与示例数据标记 ==="
docker exec docmind-db psql -U docmind -d docmind -tAc "select '新列数=' || count(*) from information_schema.columns where table_name='jobs' and column_name in ('source','source_id','apply_email')"
docker exec docmind-db psql -U docmind -d docmind -tAc "select coalesce(source,'(null)') || ' = ' || count(*) from jobs group by source order by 2 desc"

echo
echo "=== 6) 负载 ==="
uptime
