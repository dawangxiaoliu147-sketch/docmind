#!/bin/bash
# 等本轮构建上线：判据 = 本地镜像创建时间变了 **且** app 容器是刚起来的
set -uo pipefail
PREV="2026-10-11T10:22:04.793203618Z"   # 上一版（9c8f9e8 之前那个）
deadline=$(( $(date +%s) + 1800 ))
i=0
while [ "$(date +%s)" -lt "$deadline" ]; do
  i=$((i+1))
  cur=$(docker image inspect ghcr.io/dawangxiaoliu147-sketch/docmind:latest --format '{{.Created}}' 2>/dev/null || echo none)
  started=$(docker inspect docmind-app --format '{{.State.StartedAt}}' 2>/dev/null || echo none)
  age=$(( $(date +%s) - $(date -d "$started" +%s 2>/dev/null || echo 0) ))
  pulls=$(pgrep -fc "compose -f deploy/03-app" 2>/dev/null || echo 0)
  echo "[$i] $(date +%H:%M:%S) 镜像=$cur 容器已运行=${age}s 并发pull=$pulls"
  if [ "$cur" != "$PREV" ] && [ "$cur" != "none" ] && [ "$age" -lt 300 ]; then
    echo
    echo "DEPLOYED：新镜像已上线（构建时间 $cur，容器 ${age}s 前启动）"
    echo "--- migrate 尾部 ---"; docker logs --tail 6 docmind-migrate 2>&1
    echo "--- 路由 ---"
    for p in /api/health /api/jobs/import-page /api/applications /applications /jobs/import /; do
      echo -n "  $p -> "; curl -s -o /dev/null -w '%{http_code}\n' --max-time 8 "http://127.0.0.1$p"
    done
    echo "--- 容器 ---"; docker ps --format '{{.Names}}  {{.Status}}'
    echo "--- 负载 ---"; uptime
    exit 0
  fi
  sleep 30
done
echo "TIMEOUT"; exit 1
