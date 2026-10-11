#!/bin/bash
# pull 卡顿诊断（只读）
set -uo pipefail

echo "=== docker data-root ==="
docker info 2>/dev/null | grep -i "root dir" || echo "(读不到)"

echo
echo "=== 所有 compose pull 进程（含耗时）==="
ps -eo pid,etime,cmd | grep "[c]ompose -f deploy" || echo "(没有了 —— 说明 pull 已结束或被杀)"

echo
echo "=== 本地镜像 ==="
docker images --format '{{.Repository}}:{{.Tag}}  {{.ID}}  {{.CreatedSince}}  {{.Size}}'

echo
echo "=== app 镜像的创建时间（新版应该是今天）==="
docker image inspect ghcr.io/dawangxiaoliu147-sketch/docmind:latest --format '{{.Created}}' 2>/dev/null || echo "(没有这个 tag)"

echo
echo "=== D 状态（IO 阻塞）进程 ==="
ps -eo pid,stat,etime,comm | awk '$2 ~ /^D/ {print}' | head -5 || true

echo
echo "=== /var/lib/docker 占用 ==="
du -sm /var/lib/docker/* 2>/dev/null | sort -rn | head -6

echo
echo "=== 应用与数据库是否还在服务 ==="
docker ps --format '{{.Names}}  {{.Status}}  {{.Ports}}'
echo -n "本机 /api/health -> "; curl -s -o /dev/null -w '%{http_code}\n' --max-time 8 http://127.0.0.1/api/health

echo
echo "=== 时间与负载 ==="
date -Is
uptime
