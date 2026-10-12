#!/bin/bash
# 等这一版上线：镜像变了 + /api/jobs/agent 在 + 容器里已经没有旧的 jobs/library 页面
set -uo pipefail
PREV="0000"
deadline=$(( $(date +%s) + 2400 ))
i=0
while [ "$(date +%s)" -lt "$deadline" ]; do
  i=$((i+1))
  cur=$(docker image inspect ghcr.io/dawangxiaoliu147-sketch/docmind:latest --format '{{.Created}}' 2>/dev/null || echo none)
  agent=$(curl -s -o /dev/null -w '%{http_code}' --max-time 8 http://127.0.0.1/api/jobs/agent 2>/dev/null || echo 000)
  # 容器内看旧的职位库页面还在不在（目录存在=旧版）
  oldlib=$(docker exec docmind-app sh -c "ls -d '/app/.next/server/app/(app)/jobs/library' 2>/dev/null | wc -l" 2>/dev/null || echo 9)
  pulls=$(pgrep -fc "compose -f deploy/03-app" 2>/dev/null || echo 0)
  echo "[$i] $(date +%H:%M:%S) 镜像=$cur agent=$agent 旧library目录=$oldlib 并发pull=$pulls"

  if [ "$cur" != "$PREV" ] && [ "$agent" = "405" ] && [ "$oldlib" = "0" ]; then
    echo
    echo "新版已上线（镜像 $cur）"
    echo "--- 容器里的 jobs 相关路由目录 ---"
    docker exec docmind-app sh -c "ls '/app/.next/server/app/(app)/jobs' 2>/dev/null; echo '--api--'; ls /app/.next/server/app/api/jobs 2>/dev/null"
    echo "--- 路由状态 ---"
    for p in /api/health /api/jobs/agent /jobs /applications /; do
      echo -n "  $p -> "; curl -s -o /dev/null -w '%{http_code}\n' --max-time 8 "http://127.0.0.1$p"
    done
    echo "--- 容器 ---"; docker ps --format '{{.Names}}  {{.Status}}'
    echo "--- 负载 ---"; uptime
    exit 0
  fi
  sleep 30
done
echo "TIMEOUT"; exit 1
