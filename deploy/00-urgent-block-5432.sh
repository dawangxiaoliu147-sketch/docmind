#!/usr/bin/env bash
# ============================================================
# 【紧急】把 5432 从公网封掉 —— 不重启任何容器，立即生效
#
# 背景：外网实测 39.105.158.60:5432 是**开放**的，而库密码是 docmind/docmind。
# 等于全站用户数据（邮箱、密码哈希、文档内容）摆在门口。
#
# 为什么用 iptables 而不是 ufw：
#   Docker 发布端口时会在 nat 表和 FORWARD 链里插自己的规则，**绕过 ufw** ——
#   `ufw deny 5432` 对已发布的容器端口通常无效。
#
# 为什么 INPUT 和 DOCKER-USER **两条链都要加**（线上实测得到）：
#   - 如果 Docker 走「用户态代理」（docker-proxy 进程在 host 上监听），连接由 host 进程
#     接手 → 走 INPUT 链，DOCKER-USER 根本不参与；
#   - 如果走 DNAT 转发 → 走 FORWARD/DOCKER-USER 链，INPUT 不参与；
#   - 有些较新的 Docker（29.x，nftables 后端）甚至可能两条传统链都不受约束。
#   所以两条都加，而且要知道：**真正的根治是让容器根本不发布端口**（见 ../01-db/），
#   这些规则只是止血。
#
# 为什么这样不伤业务：
#   应用容器是通过 Docker 网络（容器间直连）访问数据库的，**不走这个已发布端口**。
#   所以只封「外部到 5432」不影响 app。
#
# 用法：sudo bash 00-urgent-block-5432.sh
# 回滚：sudo iptables -D INPUT       -p tcp --dport 5432 ! -s 127.0.0.1 -j DROP
#       sudo iptables -D DOCKER-USER -p tcp --dport 5432 ! -s 127.0.0.1 -j DROP
# ============================================================

set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "请用 sudo 运行" >&2
  exit 1
fi

echo "==> 封堵前，先确认链存在"
iptables -nL INPUT >/dev/null
iptables -nL DOCKER-USER >/dev/null

# 两条链都加：不同 Docker / 不同的端口发布路径走不同的链（见文件头说明）
for chain in INPUT DOCKER-USER; do
  if iptables -C "$chain" -p tcp --dport 5432 ! -s 127.0.0.1 -j DROP 2>/dev/null; then
    echo "    $chain 规则已存在，跳过"
  else
    iptables -I "$chain" -p tcp --dport 5432 ! -s 127.0.0.1 -j DROP
    echo "    $chain 已插入封堵规则"
  fi
done

echo
echo "==> 当前链内容："
echo "--- INPUT ---";       iptables -S INPUT | head -4
echo "--- DOCKER-USER ---"; iptables -S DOCKER-USER

echo
echo "==> ⚠️ 自测有个坑：从服务器本机连自己的公网 IP，源地址会是被 NAT 过的内网地址，"
echo "    会被上面这条规则挡住 —— 所以本机自测'连不上'**不能**证明外网也连不上。"
echo "    真正的验证要在**另一台机器**上做。"

cat <<'EOF'

==> 持久化（否则重启后失效；二选一）
   Debian/Ubuntu:  apt-get install -y iptables-persistent && netfilter-persistent save
   仅本次会话:      规则已在内存里，重启即失效

==> 验证（在**另一台机器**上跑，本机跑会被环回规则放过）
   nc -vz -w 3 39.105.158.60 5432      # 期望：超时 / 拒绝
   nc -vz -w 3 39.105.158.60 3000      # 期望：仍可连（应用不受影响）

注意：这只是**止血**。根治是把数据库容器改成不发布端口（见 deploy/01-db/），
      那样连规则都不需要。
EOF
