#!/usr/bin/env bash
# ============================================================
# DocMind · 网络配置第三块：防火墙
#
# 目标：公网只开 22 / 80 / 443。3000（应用）与 5432（数据库）都不对外。
#
# ⚠️ 最大的坑：Docker 发布端口时会自己往 iptables 的 nat/FORWARD 里插规则，
#    **绕过 ufw**。所以单写 `ufw deny 5432` 往往拦不住已经 compose 发布的端口。
#    真正生效的钩子是 DOCKER-USER 链 —— 本脚本两条都做，别省。
#
# 用法：sudo bash firewall.sh
# ============================================================

set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "请用 sudo 运行" >&2
  exit 1
fi

echo "==> [1/3] ufw 基础规则（只放 22 / 80 / 443）"
if command -v ufw >/dev/null 2>&1; then
  ufw allow 22/tcp  comment 'ssh'
  ufw allow 80/tcp  comment 'http'
  ufw allow 443/tcp comment 'https'
  ufw deny  3000/tcp comment 'app 只在环回，公网不该到这个端口'
  ufw deny  5432/tcp comment 'postgres 只在 docker 网络内'
  ufw --force enable
  echo
  ufw status verbose
else
  echo "没有 ufw。若用 firewalld / 云厂商安全组，请照同一意图配置：只放 22/80/443。"
fi

echo
echo "==> [2/3] INPUT + DOCKER-USER 两条链都封（不同 Docker 版本走不同路径，见文件头）"
for chain in INPUT DOCKER-USER; do
  for port in 5432 3000; do
    if iptables -C "$chain" -p tcp --dport "$port" ! -s 127.0.0.1 -j DROP 2>/dev/null; then
      echo "    $chain $port : 规则已存在"
    else
      iptables -I "$chain" -p tcp --dport "$port" ! -s 127.0.0.1 -j DROP
      echo "    $chain $port : 已封堵（保留环回）"
    fi
  done
done
echo
echo "--- INPUT ---";       iptables -S INPUT | head -5
echo "--- DOCKER-USER ---"; iptables -S DOCKER-USER

cat <<'EOF'

==> [3/3] 还没做完的两件事（脚本管不了，必须人工确认）

  1) 持久化 iptables 规则（否则重启后失效）：
       apt-get install -y iptables-persistent && netfilter-persistent save

  2) **云厂商安全组**：阿里云/腾讯云这类实例在机器外面还有一层安全组，
     ufw 和 iptables 都管不到它。如果那里放行了 5432/3000，前面全白做。
     请到控制台把入方向规则收成：22 / 80 / 443。

==> 验证（**在另一台机器上**跑，本机跑会被环回规则放过）
       nc -vz -w3 39.105.158.60 5432     # 期望：超时 / 拒绝
       nc -vz -w3 39.105.158.60 3000     # 期望：超时 / 拒绝
       curl -I http://39.105.158.60/     # 期望：nginx 正常响应 200/301
EOF
