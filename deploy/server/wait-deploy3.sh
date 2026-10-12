#!/bin/bash
# 等本轮构建上线：判据 = 本地镜像创建时间变了 且 app 容器刚起来 且新路由已生效
set -uo pipefail
PREV="2026-10-11T10:45:28.288176283Z"
deadline=$(( $(date +%s) + 1800 ))
i=0
while [ "$(date +%s)" -lt "$deadline" ]; do
  i=$((i+1))
  cur=$(docker image inspect ghcr.io/dawangxiaoliu147-sketch/docmind:latest --format '{{.Created}}' 2>/dev/null || echo none)
  agent=$(curl -s -o /dev/null -w '%{http_code}' --max-time 8 http://127.0.0.1/api/jobs/agent 2>/dev/null || echo 000)
  lib=$(curl -s -o /dev/null -w '%{http_code}' --max-time 8 http://127.0.0.1/jobs/library 2>/dev/null || echo 000)
  pulls=$(pgrep -fc "compose -f deploy/03-app" 2>/dev/null || echo 0)
  echo "[$i] $(date +%H:%M:%S) 镜像=$cur agent路由=$agent /jobs/library=$lib 并发pull=$pulls"

  if [ "$cur" != "$PREV" ] && [ "$cur" != "none" ] && [ "$agent" = "405" ] && [ "$lib" = "307" ]; then
    echo
    echo "新构建已上线（镜像 $cur）"
    echo "--- 路由 ---"
    for p in /api/health /api/jobs/agent /jobs/library /jobs /applications /; do
      echo -n "  $p -> "; curl -s -o /dev/null -w '%{http_code}\n' --max-time 8 "http://127.0.0.1$p"
    done
    echo "--- 容器 ---"; docker ps --format '{{.Names}}  {{.Status}}'
    echo "--- migrate 尾部 ---"; docker logs --tail 4 docmind-migrate 2>&1
    exit 0
  fi
  sleep 30
done
echo "TIMEOUT"; exit 1
