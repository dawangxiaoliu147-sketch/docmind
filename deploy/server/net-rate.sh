#!/bin/bash
# 判断 docker pull 到底在不在跑：采样网卡流量 + 看 docker 存储增长（只读）
set -uo pipefail

iface=$(ip route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="dev") print $(i+1)}' | head -1)
echo "主网卡: ${iface:-未知}"

rx1=$(cat /sys/class/net/"$iface"/statistics/rx_bytes 2>/dev/null || echo 0)
tx1=$(cat /sys/class/net/"$iface"/statistics/tx_bytes 2>/dev/null || echo 0)
sz1=$(du -sm /var/lib/docker 2>/dev/null | awk '{print $1}')

echo "--- 采样 20 秒 ---"
sleep 20

rx2=$(cat /sys/class/net/"$iface"/statistics/rx_bytes 2>/dev/null || echo 0)
tx2=$(cat /sys/class/net/"$iface"/statistics/tx_bytes 2>/dev/null || echo 0)
sz2=$(du -sm /var/lib/docker 2>/dev/null | awk '{print $1}')

rxr=$(awk -v a="$rx1" -v b="$rx2" 'BEGIN{printf "%.1f", (b-a)/20/1024}')
txr=$(awk -v a="$tx1" -v b="$tx2" 'BEGIN{printf "%.1f", (b-a)/20/1024}')

echo "下载速率: ${rxr} KB/s"
echo "上传速率: ${txr} KB/s"
echo "docker 目录: ${sz1} MB -> ${sz2} MB（增长 $((sz2 - sz1)) MB）"

if awk -v r="$rxr" 'BEGIN{exit !(r > 50)}'; then
  echo "结论: 在下载（可能在拉镜像层）"
elif awk -v r="$rxr" 'BEGIN{exit !(r > 5)}'; then
  echo "结论: 有流量但很慢"
else
  echo "结论: 基本没有流量 —— pull 可能卡住了"
fi

echo
echo "--- 正在跑的 docker pull 进程 ---"
ps -eo pid,etime,cmd | grep -E 'docker|containerd' | grep -v grep | head -8

echo
echo "--- 最近的 update.log / force-deploy 输出 ---"
tail -4 /home/admin/update.log 2>/dev/null

echo
echo "--- 当前 cron 状态（是否已被 force-deploy 停掉）---"
crontab -l | grep -v '^$' | tail -3
