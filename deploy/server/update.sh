#!/bin/bash
# ============================================================
# 服务器自动更新脚本（由 root cron 每 5 分钟调用）
#
# 改造前：cd /home/admin/docmind && docker compose pull && up -d && image prune
#   —— 数据库和应用在同一个 compose 项目里，一起被拉起；
#      数据库还把 5432 发布到了公网。
#
# 改造后：两个栈分开驱动。
#   - 数据库栈：镜像很少变（pgvector），pull 几乎没有开销；**不发布端口**
#   - 应用栈：每次拉 GHCR 的 :latest，这就是"push 之后自动上线"的那一步
#
# ⚠️ 这个文件是**改造的关键一环**：如果它还指着旧的单文件 compose，
#    每 5 分钟就会把旧栈（含公网 5432）重新拉起来，和新的拆分布局打架。
#
# 用法：由 cron 调用，也可手动 `bash /home/admin/update.sh` 立即更新一次
# 回滚：备份在 /home/admin/update.sh.bak-改造前
# ============================================================

set -uo pipefail

cd /home/admin/docmind || exit 1

echo "===== $(date -Is) 开始更新 ====="

echo "--- [1/3] 数据库栈 ---"
docker compose -f deploy/01-db/docker-compose.db.yml pull
docker compose -f deploy/01-db/docker-compose.db.yml up -d

echo "--- [2/3] 应用栈（拉新镜像 → 迁移 → 起服务）---"
docker compose -f deploy/03-app/docker-compose.app.yml pull
docker compose -f deploy/03-app/docker-compose.app.yml up -d

echo "--- [3/3] 清理悬空镜像 ---"
docker image prune -f

echo "--- 当前状态 ---"
docker compose -f deploy/01-db/docker-compose.db.yml ps
docker compose -f deploy/03-app/docker-compose.app.yml ps
echo "===== $(date -Is) 更新结束 ====="
