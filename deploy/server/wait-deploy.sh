#!/bin/bash
# 等待新构建上线（最多 25 分钟），只读轮询
set -uo pipefail
deadline=$(( $(date +%s) + 1500 ))
i=0
while [ "$(date +%s)" -lt "$deadline" ]; do
  i=$((i+1))
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 8 http://127.0.0.1/api/jobs/import-page 2>/dev/null || echo 000)
  tabs=$(docker exec docmind-db psql -U docmind -d docmind -tAc "select count(*) from information_schema.tables where table_name='applications'" 2>/dev/null | tr -d ' \n')
  img=$(docker image inspect ghcr.io/dawangxiaoliu147-sketch/docmind:latest --format '{{.Created}}' 2>/dev/null || echo none)
  pulls=$(pgrep -fc "compose -f deploy/03-app" 2>/dev/null || echo 0)
  echo "[$i] $(date +%H:%M:%S) import-page=$code applications=$tabs 镜像=$img 并发pull=$pulls"
  if [ "$code" = "401" ] && [ "$tabs" = "1" ]; then
    echo "DEPLOYED: 新构建已上线，登录页与新接口都在"
    echo "--- migrate 尾部 ---"; docker logs --tail 8 docmind-migrate 2>&1
    echo "--- 表清单 ---"; docker exec docmind-db psql -U docmind -d docmind -tAc "select string_agg(table_name, ', ' order by table_name) from information_schema.tables where table_schema='public'"
    echo "--- jobs 来源分布 ---"; docker exec docmind-db psql -U docmind -d docmind -tAc "select source || ' = ' || count(*) from jobs group by source"
    echo "--- 首页 ---"; curl -s -o /dev/null -w 'GET / -> %{http_code}\n' --max-time 10 http://127.0.0.1/
    exit 0
  fi
  sleep 30
done
echo "TIMEOUT: 25 分钟内没等到新构建"
docker logs --tail 20 /dev/null 2>/dev/null || true
tail -5 /home/admin/update.log 2>/dev/null || true
exit 1
