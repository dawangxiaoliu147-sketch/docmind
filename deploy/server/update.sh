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

# ── 互斥：上一次还没跑完就跳过这一轮 ─────────────────────────────
# 为什么必须有：这个镜像有 1.7GB，在慢网络下拉一次可能要十几分钟。
# 而 cron 每 5 分钟起一轮 —— 没有锁的话会堆出 6 个并发 pull 互相抢带宽，
# 结果是**谁都拉不完**（2026-10-11 实测：堆了 6 个、跑了 30 分钟、负载 4.58，镜像一直没更新）。
exec 9>/var/lock/docmind-update.lock
if ! flock -n 9; then
  echo "$(date -Is) 上一轮还没结束，本轮跳过（避免并发 pull 互相抢带宽）"
  exit 0
fi

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
