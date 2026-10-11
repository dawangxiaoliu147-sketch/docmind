#!/bin/bash
# 远端有没有新镜像（只读；pull 不会影响运行中的容器）
set -uo pipefail
cd /home/admin/docmind || exit 1

echo "=== 本地镜像时间 / 摘要 ==="
docker image inspect ghcr.io/dawangxiaoliu147-sketch/docmind:latest --format 'Created={{.Created}}'
docker image inspect ghcr.io/dawangxiaoliu147-sketch/docmind:latest --format '{{index .RepoDigests 0}}'

echo
echo "=== pull（有更新会下载层）==="
docker compose -f deploy/03-app/docker-compose.app.yml pull 2>&1 | tail -8

echo
echo "=== pull 之后的镜像时间 ==="
docker image inspect ghcr.io/dawangxiaoliu147-sketch/docmind:latest --format 'Created={{.Created}}'

echo
echo "=== update.log 最近 12 行 ==="
tail -12 /home/admin/update.log 2>/dev/null

echo
echo "=== update.log 最后修改 ==="
stat -c '%y  %s bytes' /home/admin/update.log 2>/dev/null

echo
echo "=== 当前时间 ==="
date -Is
