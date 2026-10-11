#!/usr/bin/env bash
# ============================================================
# DocMind 生产服务器 · 现状采集（**只读脚本，不修改任何东西**）
#
# 用法：
#   ssh <你的用户>@39.105.158.60
#   bash 00-recon.sh 2>&1 | tee /tmp/docmind-recon.txt
#   # 然后把 /tmp/docmind-recon.txt 的内容整段贴回来
#
# 为什么要先跑这个：改造要把数据库独立出去，必须复用**现有数据卷**。
# Docker 卷的真实名字是 `<compose 项目名>_<卷名>`，项目名一变，新容器就会挂到
# 一个空卷上 —— 界面上看就是"数据全没了"。所以卷名、项目名必须先测出来。
#
# 脚本里**不打印任何密钥的值**，只列键名。
# ============================================================

set -uo pipefail

hr() { echo; echo "===== $* ====="; }

hr "1. 系统"
uname -srm
( . /etc/os-release 2>/dev/null && echo "发行版: $PRETTY_NAME" ) || echo "发行版: 未知"
echo "内存: $(free -h 2>/dev/null | awk '/Mem:/{print $2" 总 / "$7" 可用"}')"
df -h / | tail -1

hr "2. Docker 版本"
docker --version 2>&1
docker compose version 2>&1

hr "3. 容器（含已停止）"
docker ps -a --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'

hr "4. 数据卷（找 pgdata 的真实名字）"
docker volume ls

hr "5. Docker 网络"
docker network ls

hr "6. 宿主机端口监听"
(ss -tlnp 2>/dev/null || netstat -tlnp 2>/dev/null) | head -40

hr "7. compose 项目目录"
for d in /root /home /opt /srv; do
  [ -d "$d" ] || continue
  find "$d" -maxdepth 4 \( -name "docker-compose*.yml" -o -name "compose*.yml" \) 2>/dev/null
done | sort -u

hr "8. compose 文件内容（有几个打几个）"
for f in $(for d in /root /home /opt /srv; do
    [ -d "$d" ] || continue
    find "$d" -maxdepth 4 \( -name "docker-compose*.yml" -o -name "compose*.yml" \) 2>/dev/null
  done | sort -u); do
  echo "----- $f -----"
  cat "$f"
done

hr "9. 关键容器的实际端口绑定（判断 5432 到底绑在哪）"
for c in $(docker ps --format '{{.Names}}'); do
  echo "----- $c -----"
  docker inspect "$c" --format '镜像: {{.Config.Image}}
端口: {{json .NetworkSettings.Ports}}
网络: {{range $k,$v := .NetworkSettings.Networks}}{{$k}}={{$v.IPAddress}} {{end}}
卷:   {{range .Mounts}}{{.Type}}:{{.Name}}{{.Source}} -> {{.Destination}} {{end}}
重启策略: {{.HostConfig.RestartPolicy.Name}}'
done

hr "10. Nginx"
nginx -v 2>&1 || echo "未安装 nginx"
systemctl is-active nginx 2>/dev/null || true
ls -l /etc/nginx/sites-enabled/ 2>/dev/null || echo "没有 sites-enabled 目录"
nginx -T 2>/dev/null | grep -E "server_name|listen|proxy_pass" | head -20

hr "11. 防火墙"
ufw status verbose 2>/dev/null || echo "没有 ufw"
echo "--- DOCKER-USER 链（Docker 会绕过 ufw，真正生效的是这里）---"
iptables -S DOCKER-USER 2>/dev/null || echo "读不到 DOCKER-USER"

hr "12. 数据库规模与版本（决定停机窗口和迁移方式）"
for c in $(docker ps --format '{{.Names}}'); do
  if docker exec "$c" pg_isready -U docmind >/dev/null 2>&1; then
    echo "----- 容器 $c -----"
    docker exec "$c" psql -U docmind -d docmind -tAc "select version();"
    docker exec "$c" psql -U docmind -d docmind -tAc "select 'DB 大小: ' || pg_size_pretty(pg_database_size('docmind'));"
    docker exec "$c" psql -U docmind -d docmind -tAc "select '用户数: ' || count(*) from users;"
    docker exec "$c" psql -U docmind -d docmind -tAc "select '文档数: ' || count(*) from documents;"
    docker exec "$c" psql -U docmind -d docmind -tAc "select '片段数: ' || count(*) from chunks;"
    docker exec "$c" psql -U docmind -d docmind -tAc "select extname from pg_extension;"
    echo "--- 各表大小 ---"
    docker exec "$c" psql -U docmind -d docmind -c "\dt+"
  fi
done

hr "13. 服务器上 .env 的键名（**只列键名，不打印值**）"
for f in $(find /root /home /opt /srv -maxdepth 3 -name ".env" 2>/dev/null | sort -u); do
  echo "----- $f -----"
  grep -oE '^[A-Za-z_][A-Za-z0-9_]*' "$f" | sort
done

hr "14. 现有备份痕迹"
ls -lh /var/backups 2>/dev/null | head -10
crontab -l 2>/dev/null | head -20 || echo "无 crontab"

hr "15. 证书与域名"
ls -l /etc/letsencrypt/live/ 2>/dev/null || echo "没有 letsencrypt 证书"

echo
echo "===== 采集结束：把上面全部内容贴回来即可 ====="
