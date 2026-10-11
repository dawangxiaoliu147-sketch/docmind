#!/bin/bash
# 判断"是这台机器的出口慢，还是只有 GHCR 慢"（只读，下载到 /dev/null）
set -uo pipefail

echo "=== 对照组 1：国内 CDN（npmmirror，约 25MB）==="
timeout 90 curl -s -o /dev/null -w '  速度 %{speed_download} B/s  状态 %{http_code}  用时 %{time_total}s\n' \
  https://registry.npmmirror.com/-/binary/node/v20.0.0/node-v20.0.0-linux-x64.tar.xz || echo "  失败/超时"

echo
echo "=== 对照组 2：阿里云自家镜像站（约 10MB）==="
timeout 90 curl -s -o /dev/null -w '  速度 %{speed_download} B/s  状态 %{http_code}  用时 %{time_total}s\n' \
  https://mirrors.aliyun.com/ubuntu/ls-lR.gz || echo "  失败/超时"

echo
echo "=== 目标：GHCR 的 blob 端点（不带鉴权，只看握手与首字节）==="
timeout 30 curl -s -o /dev/null -w '  连接 %{time_connect}s  TLS %{time_appconnect}s  状态 %{http_code}\n' https://ghcr.io/v2/ || true

echo
echo "=== 今天拉镜像的累计流量（看还在不在动）==="
rx1=$(cat /sys/class/net/eth0/statistics/rx_bytes)
sleep 30
rx2=$(cat /sys/class/net/eth0/statistics/rx_bytes)
awk -v a="$rx1" -v b="$rx2" 'BEGIN{printf "  30 秒平均下载 %.1f KB/s\n", (b-a)/30/1024}'

echo
echo "=== update.log 尾部（层有没有在变）==="
tail -4 /home/admin/update.log 2>/dev/null

echo
echo "=== 并发 pull 进程数 ==="
pgrep -fc "compose -f deploy/03-app" || echo 0
