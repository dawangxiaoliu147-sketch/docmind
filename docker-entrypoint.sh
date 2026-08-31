#!/bin/sh
set -e

# 统一入口：
#   ./docker-entrypoint.sh migrate  -> 仅执行数据库迁移（K8s initContainer / compose 一次性任务）
#   ./docker-entrypoint.sh server   -> 启动 Next.js 服务（默认）

if [ "$1" = "migrate" ]; then
  echo "[docmind] 执行数据库迁移..."
  # 等待数据库就绪：失败则重试，最多 30 次、每次间隔 2 秒
  n=0
  until ./node_modules/.bin/prisma migrate deploy; do
    n=$((n + 1))
    if [ "$n" -ge 30 ]; then
      echo "[docmind] 数据库迁移失败（已重试 30 次）" >&2
      exit 1
    fi
    echo "[docmind] 数据库未就绪，2 秒后重试 ($n/30)..."
    sleep 2
  done
  echo "[docmind] 迁移完成"
  exit 0
fi

echo "[docmind] 启动服务 (port ${PORT:-3000})..."
exec ./node_modules/.bin/next start -H 0.0.0.0 -p "${PORT:-3000}"
