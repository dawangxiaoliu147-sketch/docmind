#!/bin/bash
# 服务器端语法自检 + 确认 compose 里的卷名仍是真实值
set -uo pipefail
cd /home/admin/docmind/deploy || exit 1

echo "===== bash -n 语法检查 ====="
fail=0
for f in 00-recon.sh 00-urgent-block-5432.sh 00b-facts.sh 00c-facts2.sh \
         10-generate.sh 99-verify.sh 01-db/backup.sh \
         02-net/firewall.sh \
         server/update.sh server/cutover.sh server/finish.sh server/restore-cron.sh; do
  if [ ! -f "$f" ]; then echo "MISS $f"; continue; fi
  if bash -n "$f" 2>/dev/null; then echo "OK   $f"; else echo "FAIL $f"; fail=$((fail+1)); fi
done
echo "语法失败数: $fail"

echo
echo "===== compose 里的卷名（必须是真实名，不能是 FILL_ME）====="
grep -n 'name: docmind_' 01-db/docker-compose.db.yml 03-app/docker-compose.app.yml || echo "(没找到?)"
echo "--- 有没有残留占位符 ---"
if grep -rn 'FILL_ME' . 2>/dev/null; then echo "!! 还有占位符残留"; else echo "✓ 没有 FILL_ME 残留"; fi

echo
echo "===== 当前栈状态 ====="
docker compose -f 01-db/docker-compose.db.yml ps
docker compose -f 03-app/docker-compose.app.yml ps

echo
echo "===== cron 与 update.sh ====="
crontab -l | grep -v '^#' | grep -v '^$'
grep -c 'deploy/0' /home/admin/update.sh

echo
echo "===== update.log 最近 12 行（看自动更新有没有正常跑）====="
tail -12 /home/admin/update.log 2>/dev/null || echo "(没有日志)"
