#!/bin/bash
# ============================================================
# 切换收尾：nginx 反代 + 新的 update.sh + 防火墙第二层 + 恢复 cron + 验收
#
# 用法：bash /home/admin/docmind/deploy/server/finish.sh
# ============================================================

set -uo pipefail
REPO=/home/admin/docmind
DEPLOY="$REPO/deploy"
cd "$REPO" || exit 1

hr() { echo; echo "===== $* ====="; }

hr "0/6 确认容器还在跑"
docker ps --format '{{.Names}}  {{.Status}}  {{.Ports}}'

hr "1/6 安装并配置 nginx"
if ! command -v nginx >/dev/null 2>&1; then
  echo "安装 nginx..."
  apt-get update -qq && apt-get install -y -qq nginx
fi
nginx -v 2>&1
cp "$DEPLOY/02-net/nginx/docmind.conf" /etc/nginx/sites-available/docmind
ln -sf /etc/nginx/sites-available/docmind /etc/nginx/sites-enabled/docmind
rm -f /etc/nginx/sites-enabled/default
if nginx -t; then
  systemctl enable nginx >/dev/null 2>&1
  systemctl restart nginx
  echo "nginx 状态: $(systemctl is-active nginx)"
else
  echo "!! nginx 配置语法不对，没有重启 —— 先修 /etc/nginx/sites-available/docmind"
fi

hr "2/6 经 nginx 验证（这一步恢复外网访问）"
curl -s -o /dev/null -w '  经 nginx /api/health -> %{http_code}\n' --max-time 15 http://127.0.0.1/api/health
curl -s --max-time 15 http://127.0.0.1/api/health; echo
curl -s -o /dev/null -w '  经 nginx 首页 -> %{http_code}\n' --max-time 20 http://127.0.0.1/
echo "  --- 直接访问应用端口（应仍可用，但只在环回）---"
curl -s -o /dev/null -w '  127.0.0.1:3000/api/health -> %{http_code}\n' --max-time 10 http://127.0.0.1:3000/api/health

hr "3/6 安装新的 update.sh（让 5 分钟一轮的 cron 驱动新栈）"
if [ ! -f /home/admin/update.sh.before-cutover ]; then
  cp /home/admin/update.sh /home/admin/update.sh.before-cutover
  echo "  旧脚本已备份到 /home/admin/update.sh.before-cutover"
fi
cp "$DEPLOY/server/update.sh" /home/admin/update.sh
chmod +x /home/admin/update.sh
echo "  --- 新脚本前 8 行 ---"
head -8 /home/admin/update.sh

hr "4/6 防火墙第二层（端口已不再发布，这只是纵深防御）"
# 不同 Docker 版本走不同路径（用户态 proxy / DNAT / nftables），两条链都加
iptables -C INPUT       -p tcp --dport 5432 ! -s 127.0.0.1 -j DROP 2>/dev/null || iptables -I INPUT       -p tcp --dport 5432 ! -s 127.0.0.1 -j DROP
iptables -C DOCKER-USER -p tcp --dport 5432 ! -s 127.0.0.1 -j DROP 2>/dev/null || iptables -I DOCKER-USER -p tcp --dport 5432 ! -s 127.0.0.1 -j DROP
echo "--- INPUT ---";       iptables -S INPUT | head -4
echo "--- DOCKER-USER ---"; iptables -S DOCKER-USER
echo
echo "注：本机 Docker 29 的转发路径可能不受传统 iptables 约束（实测过），"
echo "    所以**真正的防线是容器不再发布端口**；这些规则只是第二层。"

hr "5/6 恢复 cron（现在是新的 update.sh 了）"
if crontab -l 2>/dev/null | grep -q 'CUTOVER_DISABLED'; then
  # 首选：直接用切换前留的备份恢复（最稳）
  BAK="$(ls -1t /root/crontab.before-cutover.*.bak 2>/dev/null | head -1 || true)"
  if [ -n "$BAK" ]; then
    crontab "$BAK" && echo "  已从 $BAK 恢复"
  else
    # 兜底：把注释前缀去掉（注意是去掉，不是加上 —— 之前这里写反过一次）
    crontab -l 2>/dev/null | sed 's|^#CUTOVER_DISABLED ||' | crontab - && echo "  已去掉注释前缀"
  fi
  echo "  当前活动行："
  crontab -l | grep -v '^#' | grep -v '^$' || echo "  (没有活动行?)"
else
  echo "  没有 CUTOVER_DISABLED 标记，当前 crontab 尾部："
  crontab -l 2>/dev/null | tail -3
fi

hr "6/6 验收"
bash "$DEPLOY/99-verify.sh"
