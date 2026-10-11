#!/bin/bash
# 等"文案修复"这一版真正上线：判据 = 容器内的构建产物里不再有 markdown 星号
set -uo pipefail
PREV="2026-10-11T10:38:14.848278928Z"
deadline=$(( $(date +%s) + 1800 ))
i=0
while [ "$(date +%s)" -lt "$deadline" ]; do
  i=$((i+1))
  cur=$(docker image inspect ghcr.io/dawangxiaoliu147-sketch/docmind:latest --format '{{.Created}}' 2>/dev/null || echo none)

  # 容器内检查：构建产物里还有没有旧的 markdown 写法
  old=$(docker exec docmind-app sh -c "grep -r -l '不用登录也能验证' /app/.next/server 2>/dev/null | head -1" 2>/dev/null || true)
  hasold=0
  if [ -n "$old" ]; then
    if docker exec docmind-app sh -c "grep -r -q '\*\*不用登录也能验证\*\*' /app/.next/server 2>/dev/null"; then hasold=1; fi
  fi
  pulls=$(pgrep -fc "compose -f deploy/03-app" 2>/dev/null || echo 0)
  ui=$(curl -s --max-time 10 http://127.0.0.1/ui | grep -c '\*\*' || echo 0)

  echo "[$i] $(date +%H:%M:%S) 本地镜像=$cur 产物含旧星号=$hasold /ui页星号数=$ui 并发pull=$pulls"

  if [ "$cur" != "$PREV" ] && [ "$cur" != "none" ] && [ "$hasold" = "0" ]; then
    echo
    echo "文案修复已上线（镜像 $cur）"
    echo "--- /ui 页里那句话现在的样子 ---"
    curl -s --max-time 10 http://127.0.0.1/ui | grep -o '.\{0,6\}不用登录也能验证.\{0,10\}' | head -2
    echo "--- /ui 页连续星号总数（应为 0）---"
    curl -s --max-time 10 http://127.0.0.1/ui | grep -o '\*\*' | wc -l
    echo "--- 容器状态 ---"; docker ps --format '{{.Names}}  {{.Status}}'
    exit 0
  fi
  sleep 30
done
echo "TIMEOUT"; exit 1
