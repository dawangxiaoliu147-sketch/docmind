#!/bin/bash
# 恢复切换前的 crontab（切换时把 */5 那行注释掉了；新 update.sh 已就位，现在可以恢复）
set -uo pipefail

BAK="$(ls -1t /root/crontab.before-cutover.*.bak 2>/dev/null | head -1 || true)"
if [ -z "$BAK" ]; then
  echo "!! 找不到 /root/crontab.before-cutover.*.bak"
  echo "--- 当前 crontab ---"; crontab -l 2>/dev/null || echo "(空)"
  exit 1
fi

echo "恢复自: $BAK"
echo "--- 备份内容（非注释行）---"
grep -v '^#' "$BAK" | grep -v '^$' || true

crontab "$BAK" || { echo "!! 安装失败"; exit 1; }

echo
echo "--- 恢复后的活动行 ---"
crontab -l | grep -v '^#' | grep -v '^$' || echo "(没有活动行?)"

# 确认 update.sh 已经是新版本
echo
echo "--- 当前 update.sh 指向的栈（应能看到 deploy/01-db 与 deploy/03-app）---"
grep -nE 'docker compose' /home/admin/update.sh || true
