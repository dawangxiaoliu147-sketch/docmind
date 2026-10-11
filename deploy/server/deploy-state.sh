#!/bin/bash
# 部署进度（只读）：新构建到底上了没
set -uo pipefail

echo "=== 迁移文件数（本地 12 个 = 新版镜像）==="
docker logs docmind-migrate 2>&1 | grep -o '[0-9]* migrations found' | tail -1

echo "=== migrate 最近 4 行 ==="
docker logs --tail 4 docmind-migrate 2>&1

echo "=== 新路由 /api/jobs/sync（404=旧构建，401=新构建）==="
curl -s -o /dev/null -w '%{http_code}\n' --max-time 8 http://127.0.0.1/api/jobs/sync

echo "=== jobs 表新列数（期望 3：source / source_id / apply_email）==="
docker exec docmind-db psql -U docmind -d docmind -tAc "select count(*) from information_schema.columns where table_name='jobs' and column_name in ('source','source_id','apply_email')"

echo "=== 示例职位是否已被标记（期望 source='demo' 计 12）==="
docker exec docmind-db psql -U docmind -d docmind -tAc "select coalesce(source,'(null)') || ' = ' || count(*) from jobs group by source order by 2 desc"

echo "=== 当前运行镜像 ==="
docker inspect docmind-app --format '{{.Image}}' | xargs -r docker image inspect --format '创建于 {{.Created}}  标签 {{.RepoTags}}'

echo "=== update.log 最近 8 行 ==="
tail -8 /home/admin/update.log 2>/dev/null

echo "=== cron 下一轮 ==="
crontab -l | grep -v '^#' | grep -v '^$'
