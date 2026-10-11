#!/bin/bash
# 修复中断的 pull：重启 docker 清掉 containerd 的陈旧 lease，然后重新拉取并上线。
# 会短暂重启容器（应用有 restart: unless-stopped，会自动回来）。
set -uo pipefail
cd /home/admin/docmind || exit 1
APP_STACK=deploy/03-app/docker-compose.app.yml
DB_STACK=deploy/01-db/docker-compose.db.yml

echo "=== 1) 清掉残留 pull 进程 ==="
pkill -f "compose -f deploy" 2>/dev/null || true
sleep 2
ps -eo pid,cmd | grep "[c]ompose -f deploy" || echo "✓ 无残留"
echo "负载: $(cut -d' ' -f1-3 /proc/loadavg)"

echo
echo "=== 2) 重启 docker 守护进程（清理 lease）==="
echo "重启前:"; docker ps --format '{{.Names}}  {{.Status}}'
systemctl restart docker
for i in $(seq 1 30); do docker info >/dev/null 2>&1 && break; sleep 2; done
echo "重启后:"; docker ps -a --format '{{.Names}}  {{.Status}}'

echo
echo "=== 3) 重新拉镜像 ==="
START=$(date +%s)
docker compose -f "$APP_STACK" pull && echo "✓ pull 成功，用时 $(( $(date +%s) - START )) 秒" || echo "✗ pull 仍失败"

echo
echo "=== 4) 拉起两个栈 ==="
docker compose -f "$DB_STACK" up -d
docker compose -f "$APP_STACK" up -d
sleep 12

echo
echo "=== 5) 验证 ==="
docker ps --format '{{.Names}}  {{.Status}}  {{.Ports}}'
echo "--- migrate 尾部 ---"; docker logs --tail 5 docmind-migrate 2>&1
echo -n "/api/jobs/sync -> "; curl -s -o /dev/null -w '%{http_code}\n' --max-time 8 http://127.0.0.1/api/jobs/sync
echo -n "首页 -> "; curl -s -o /dev/null -w '%{http_code}\n' --max-time 10 http://127.0.0.1/
echo "镜像创建时间: $(docker image inspect ghcr.io/dawangxiaoliu147-sketch/docmind:latest --format '{{.Created}}')"
echo -n "新列数: "; docker exec docmind-db psql -U docmind -d docmind -tAc "select count(*) from information_schema.columns where table_name='jobs' and column_name in ('source','source_id','apply_email')"
docker exec docmind-db psql -U docmind -d docmind -tAc "select coalesce(source,'(null)') || ' = ' || count(*) from jobs group by source order by 2 desc"
echo "负载: $(cut -d' ' -f1-3 /proc/loadavg)"
