#!/bin/bash
# 上线核验 + 恢复 cron（只读检查为主）
set -uo pipefail
cd /home/admin/docmind || exit 1

echo "=== 1) 恢复 cron（update.sh 已带 flock 互斥，不会再堆积 pull）==="
BAK="$(ls -1t /root/crontab.before-cutover.*.bak 2>/dev/null | head -1 || true)"
if [ -n "$BAK" ]; then crontab "$BAK" && echo "已从 $BAK 恢复"; else echo "找不到备份"; fi
crontab -l | grep -v '^#' | grep -v '^$'
echo -n "update.sh 里的 flock 行数: "; grep -c flock /home/admin/update.sh

echo
echo "=== 2) 数据库：来源分布（示例应标成 demo）==="
docker exec docmind-db psql -U docmind -d docmind -tAc "select source || ' = ' || count(*) from jobs group by source"

echo
echo "=== 3) jobs 表字段 ==="
docker exec docmind-db psql -U docmind -d docmind -tAc "select string_agg(column_name, ', ' order by ordinal_position) from information_schema.columns where table_name='jobs'"

echo
echo "=== 3b) 投递记录表是否存在 ==="
docker exec docmind-db psql -U docmind -d docmind -tAc "select count(*) || ' 张 applications 表' from information_schema.tables where table_name='applications'"
docker exec docmind-db psql -U docmind -d docmind -tAc "select string_agg(column_name, ', ' order by ordinal_position) from information_schema.columns where table_name='applications'"

echo
echo "=== 4) 路由可达性（401=新接口在，需登录）==="
for p in /api/health /api/jobs/sync /api/jobs/import-page /api/applications /applications /jobs/import /jobs /; do
  echo -n "  $p -> "; curl -s -o /dev/null -w '%{http_code}\n' --max-time 8 "http://127.0.0.1$p"
done

echo
echo "=== 5) 容器与镜像 ==="
docker ps --format '{{.Names}}  {{.Status}}  {{.Ports}}'
docker image inspect ghcr.io/dawangxiaoliu147-sketch/docmind:latest --format '镜像构建于 {{.Created}}'

echo
echo "=== 6) 负载 ==="
uptime
