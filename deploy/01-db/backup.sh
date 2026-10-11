#!/usr/bin/env bash
# ============================================================
# 改造前的强制作业：整库备份 + 校验
#
# 为什么不能跳过：接下来要动的是**容器编排与网络**（不是数据本身），
# 但只要卷名/项目名写错一次，容器就会挂到空卷上。有这份 dump，任何情况都能救回来。
#
# 用法：bash backup.sh [输出目录]        # 默认 /var/backups/docmind
# 产物：docmind-YYYYmmdd-HHMMSS.dump     （自定义格式，pg_restore 可整库还原）
#       docmind-YYYYmmdd-HHMMSS.sql.gz   （纯 SQL，肉眼可查、可单表提取）
#       MANIFEST.txt                     （时间、大小、校验和、行数）
# ============================================================

set -euo pipefail

OUT_DIR="${1:-/var/backups/docmind}"
CONTAINER="${DOCMIND_DB_CONTAINER:-docmind-db}"
STAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$OUT_DIR"

echo "==> 目标容器: $CONTAINER"
docker ps --format '{{.Names}}' | grep -qx "$CONTAINER" || {
  echo "找不到运行中的容器 $CONTAINER —— 用 DOCMIND_DB_CONTAINER=名字 指定" >&2
  exit 1
}

CUSTOM="$OUT_DIR/docmind-$STAMP.dump"
PLAIN="$OUT_DIR/docmind-$STAMP.sql.gz"
MANIFEST="$OUT_DIR/MANIFEST.txt"

echo "==> [1/3] 自定义格式 dump（还原用这个）"
docker exec "$CONTAINER" pg_dump -U docmind -d docmind -Fc > "$CUSTOM"

echo "==> [2/3] 纯 SQL dump（可读、可单表提取）"
docker exec "$CONTAINER" pg_dump -U docmind -d docmind --clean --if-exists | gzip > "$PLAIN"

echo "==> [3/3] 记录清单与校验和"
{
  echo "时间:       $(date -Is)"
  echo "容器:       $CONTAINER"
  echo "PG 版本:    $(docker exec "$CONTAINER" psql -U docmind -d docmind -tAc 'select version();')"
  echo "库大小:     $(docker exec "$CONTAINER" psql -U docmind -d docmind -tAc "select pg_size_pretty(pg_database_size('docmind'));")"
  echo "用户数:     $(docker exec "$CONTAINER" psql -U docmind -d docmind -tAc 'select count(*) from users;')"
  echo "知识库数:   $(docker exec "$CONTAINER" psql -U docmind -d docmind -tAc 'select count(*) from knowledge_bases;')"
  echo "文档数:     $(docker exec "$CONTAINER" psql -U docmind -d docmind -tAc 'select count(*) from documents;')"
  echo "片段数:     $(docker exec "$CONTAINER" psql -U docmind -d docmind -tAc 'select count(*) from chunks;')"
  echo
  echo "文件:"
  ls -lh "$CUSTOM" "$PLAIN"
  echo
  echo "sha256:"
  sha256sum "$CUSTOM" "$PLAIN"
} | tee "$MANIFEST"

echo
echo "==> 完成。备份在 $OUT_DIR"
echo "==> 校验（强烈建议做一次，确认 dump 能读）："
echo "    docker exec -i $CONTAINER pg_restore -l < $CUSTOM | head"
echo
echo "⚠️ 备份也在同一台机器上 —— 有条件请同步到别处（scp / 对象存储）："
echo "    scp $CUSTOM <你>@<另一台机器>:/path/"
