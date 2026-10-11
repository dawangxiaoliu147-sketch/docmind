#!/bin/bash
# 为什么线上还是旧镜像：看 cron 到底在干什么（只读）
set -uo pipefail

echo "=== update.log 最后修改时间 ==="
stat -c '%y' /home/admin/update.log 2>/dev/null || echo "(无 update.log)"

echo
echo "=== update.log 尾部 20 行 ==="
tail -20 /home/admin/update.log 2>/dev/null || echo "(空)"

echo
echo "=== cron 是否启用 ==="
crontab -l | grep -v '^$'

echo
echo "=== update.sh 是否含互斥锁 ==="
grep -n "flock" /home/admin/update.sh || echo "(没有 flock！)"

echo
echo "=== 注册表里的镜像摘要（跟本地比）==="
echo -n "本地: "; docker image inspect ghcr.io/dawangxiaoliu147-sketch/docmind:latest --format '{{index .RepoDigests 0}}' 2>/dev/null || echo none
echo -n "远端: "; timeout 60 docker manifest inspect ghcr.io/dawangxiaoliu147-sketch/docmind:latest 2>&1 | head -c 200 || echo "(取不到)"

echo
echo
echo "=== 手动探一次远端有没有新镜像（只读，不改容器）==="
timeout 240 docker compose -f deploy/03-app/docker-compose.app.yml pull 2>&1 | tail -6

echo
echo "=== 拉完之后镜像时间 ==="
docker image inspect ghcr.io/dawangxiaoliu147-sketch/docmind:latest --format '{{.Created}}'

echo
echo "=== 当前时间 ==="
date -Is
