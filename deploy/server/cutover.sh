#!/bin/bash
# ============================================================
# 切换：旧单栈 → 数据库栈 + 应用栈
#
# 安全设计：
#   - 第一步停 cron（否则每 5 分钟的 update.sh 会把旧栈重新拉起来，和拆分布局打架）
#   - 备份清单必须存在（行数用于切换后对账）
#   - 停旧栈用 `docker compose down`，**绝无 -v**；命名卷不受影响
#   - 起完数据库栈立刻对账行数，不一致就退出，不继续起应用
#
# 用法：bash /home/admin/docmind/deploy/server/cutover.sh
# ============================================================

set -uo pipefail
cd /home/admin/docmind || exit 1
REPO=/home/admin/docmind
DB_STACK="$REPO/deploy/01-db/docker-compose.db.yml"
APP_STACK="$REPO/deploy/03-app/docker-compose.app.yml"

hr() { echo; echo "===== $* ====="; }
die() { echo; echo "!!!! $* —— 已停止，不继续往下做"; exit 1; }

hr "0/6 前置检查"
[ -f /var/backups/docmind/MANIFEST.txt ] || die "没有备份清单，先跑 deploy/01-db/backup.sh"
[ -f "$DB_STACK" ] || die "找不到 $DB_STACK"
[ -f "$APP_STACK" ] || die "找不到 $APP_STACK"
grep -q 'name: docmind_pgdata' "$DB_STACK" || die "数据库栈的卷名没填（先跑 10-generate.sh）"
grep -q 'docmind_uploads' "$APP_STACK" || die "应用栈的 uploads 卷名没填（先跑 10-generate.sh）"

echo "--- 备份清单（切换后要对账）---"
grep -E '^(时间|用户数|知识库数|文档数|片段数)' /var/backups/docmind/MANIFEST.txt

BEFORE_USERS=$(docker exec docmind-db psql -U docmind -d docmind -tAc 'select count(*) from users' 2>/dev/null | tr -d '[:space:]')
BEFORE_CHUNKS=$(docker exec docmind-db psql -U docmind -d docmind -tAc 'select count(*) from chunks' 2>/dev/null | tr -d '[:space:]')
echo "切换前：users=$BEFORE_USERS chunks=$BEFORE_CHUNKS"
[ -n "$BEFORE_USERS" ] || die "读不到旧库的用户数，先确认 docmind-db 在跑"

hr "1/6 停 cron（防止旧 update.sh 把旧栈重新拉起来）"
crontab -l > "/root/crontab.before-cutover.$(date +%s).bak" 2>/dev/null || true
if crontab -l 2>/dev/null | grep -q '^[^#].*update\.sh'; then
  crontab -l 2>/dev/null | sed -E 's#^([^#].*update\.sh.*)$#\#CUTOVER_DISABLED \1#' | crontab -
  echo "已注释掉 cron："; crontab -l | tail -2
else
  echo "（cron 里已经没有活动的 update.sh 行）"; crontab -l 2>/dev/null | tail -2
fi

hr "2/6 停旧栈（保留命名卷）"
docker compose ps
docker compose down
echo "--- 剩下的容器 ---"
docker ps -a --format '{{.Names}}  {{.Status}}'

hr "3/6 起数据库栈"
docker compose -f "$DB_STACK" up -d
for i in $(seq 1 30); do
  st=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{end}}' docmind-db 2>/dev/null)
  [ "$st" = "healthy" ] && break
  sleep 2
done
echo "docmind-db health=$st"
docker compose -f "$DB_STACK" ps

hr "4/6 对账（最关键的一步）"
AFTER_USERS=$(docker exec docmind-db psql -U docmind -d docmind -tAc 'select count(*) from users' 2>/dev/null | tr -d '[:space:]')
AFTER_CHUNKS=$(docker exec docmind-db psql -U docmind -d docmind -tAc 'select count(*) from chunks' 2>/dev/null | tr -d '[:space:]')
echo "切换前 users=$BEFORE_USERS chunks=$BEFORE_CHUNKS"
echo "切换后 users=$AFTER_USERS chunks=$AFTER_CHUNKS"
[ "$AFTER_USERS" = "$BEFORE_USERS" ] || die "用户数不一致（$BEFORE_USERS → $AFTER_USERS）：卷可能挂错了，别继续"
[ "$AFTER_CHUNKS" = "$BEFORE_CHUNKS" ] || die "片段数不一致（$BEFORE_CHUNKS → $AFTER_CHUNKS）：卷可能挂错了，别继续"
echo "✓ 数据一致，卷接对了"

echo "--- 数据库端口（应为空）---"
PT=$(docker port docmind-db 2>/dev/null)
[ -z "$PT" ] && echo "✓ 未发布任何端口" || die "数据库仍发布端口：$PT"

hr "5/6 起应用栈（migrate → app）"
docker compose -f "$APP_STACK" up -d
sleep 6
docker compose -f "$APP_STACK" ps
echo "--- migrate 日志尾部 ---"
docker logs --tail 6 docmind-migrate 2>&1 || true

hr "6/6 应用可用性"
if curl -fsS --max-time 15 http://127.0.0.1:3000/api/health; then
  echo "  ✓ 应用健康"
else
  echo "  !! /api/health 没返回 —— 看 docker logs docmind-app"
fi
echo "--- 应用端口（应只有 127.0.0.1:3000）---"
docker port docmind-app 2>/dev/null || echo "(无)"

hr "切换完成"
echo "后续：装 nginx（80 反代）→ 防火墙 → 装新的 update.sh → 恢复 cron → 验收"
echo "注意：cron 目前是停的，别忘了 finish.sh 那一步。"
