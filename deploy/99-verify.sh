#!/usr/bin/env bash
# ============================================================
# DocMind 改造后 · 自动验收（**只读**，不改任何东西）
#
# 用法：bash 99-verify.sh
#   可选环境变量：
#     DOCMIND_DB_CONTAINER / DOCMIND_APP_CONTAINER  容器名（默认 docmind-db / docmind-app）
#     PUBLIC_HOST                                   对外域名或 IP（默认 39.105.158.60）
#     MANIFEST                                      备份清单路径（默认 /var/backups/docmind/MANIFEST.txt）
#
# 退出码：0 = 全部通过；1 = 有失败项
# ============================================================

set -uo pipefail

DB="${DOCMIND_DB_CONTAINER:-docmind-db}"
APP="${DOCMIND_APP_CONTAINER:-docmind-app}"
PUBLIC_HOST="${PUBLIC_HOST:-39.105.158.60}"
MANIFEST="${MANIFEST:-/var/backups/docmind/MANIFEST.txt}"

pass=0; fail=0
ok()  { printf '  \033[32mPASS\033[0m  %s\n' "$*"; pass=$((pass+1)); }
no()  { printf '  \033[31mFAIL\033[0m  %s\n' "$*"; fail=$((fail+1)); }
info(){ printf '  \033[36mINFO\033[0m  %s\n' "$*"; }
hr()  { echo; echo "===== $* ====="; }

# 断言助手：chk "描述" 命令...
chk() { local d="$1"; shift; if "$@" >/dev/null 2>&1; then ok "$d"; else no "$d"; fi; }
# 反向断言：必须为空才是对的
chk_empty() { local d="$1" v="$2"; if [ -z "$v" ]; then ok "$d"; else no "$d（实际: $v）"; fi; }

hr "1. 容器状态"
chk "数据库容器在运行 ($DB)"      bash -c "docker inspect -f '{{.State.Running}}' '$DB' | grep -qx true"
chk "应用容器在运行 ($APP)"       bash -c "docker inspect -f '{{.State.Running}}' '$APP' | grep -qx true"
chk "数据库健康检查通过"           bash -c "docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{end}}' '$DB' | grep -qx healthy"
chk "应用健康检查通过"             bash -c "docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{end}}' '$APP' | grep -qx healthy"
chk "数据库重启策略 unless-stopped" bash -c "docker inspect -f '{{.HostConfig.RestartPolicy.Name}}' '$DB' | grep -qx unless-stopped"
chk "应用重启策略 unless-stopped"   bash -c "docker inspect -f '{{.HostConfig.RestartPolicy.Name}}' '$APP' | grep -qx unless-stopped"

hr "2. 端口暴露面（最关键的一组）"
# 注意：容器不存在时 `docker port` 也输出空 —— 那样会被误判成"未发布端口 ✔"。
# 所以先确认容器存在，再看端口。
if ! docker inspect "$DB" >/dev/null 2>&1; then
  no "数据库容器 $DB 不存在，端口无法检查（先确认容器名）"
else
  chk_empty "数据库未发布任何端口（docker port 应为空）" "$(docker port "$DB" 2>/dev/null)"
fi

if ! docker inspect "$APP" >/dev/null 2>&1; then
  no "应用容器 $APP 不存在，端口无法检查（先确认容器名）"
else
  APP_PORTS="$(docker port "$APP" 2>/dev/null)"
  if echo "$APP_PORTS" | grep -q "127.0.0.1:3000"; then
    ok "应用只绑环回 127.0.0.1:3000"
  elif [ -z "$APP_PORTS" ]; then
    ok "应用未发布端口（说明 nginx 用容器接入，同样安全）"
  else
    no "应用端口绑定不是环回：$APP_PORTS  ← 公网可能能直连"
  fi
fi

hr "3. 应用自身可用"
chk "后端 /api/health 返回 ok"  bash -c "curl -fsS --max-time 10 http://127.0.0.1:3000/api/health | grep -q '\"status\":\"ok\"'"
chk "首页能返回 HTML"           bash -c "curl -fsS --max-time 10 http://127.0.0.1:3000/ | grep -qi '<html'"

hr "4. 数据库可用与数据完整性"
chk "PostgreSQL 就绪"           docker exec "$DB" pg_isready -U docmind -d docmind
TABLES="$(docker exec "$DB" psql -U docmind -d docmind -tAc "select count(*) from information_schema.tables where table_schema='public'" 2>/dev/null | tr -d '[:space:]')"
if [ -n "$TABLES" ] && [ "$TABLES" -ge 8 ] 2>/dev/null; then
  ok "public 模式下有 $TABLES 张表（≥8）"
else
  no "表数量异常：${TABLES:-读不到}"
fi

q() { docker exec "$DB" psql -U docmind -d docmind -tAc "$1" 2>/dev/null | tr -d '[:space:]'; }
U="$(q 'select count(*) from users')"
K="$(q 'select count(*) from knowledge_bases')"
D="$(q 'select count(*) from documents')"
C="$(q 'select count(*) from chunks')"
echo "        用户=$U  知识库=$K  文档=$D  片段=$C"

if [ -f "$MANIFEST" ]; then
  mu="$(awk -F': *' '/^用户数/{print $2}' "$MANIFEST" | tr -d '[:space:]')"
  md="$(awk -F': *' '/^文档数/{print $2}' "$MANIFEST" | tr -d '[:space:]')"
  mc="$(awk -F': *' '/^片段数/{print $2}' "$MANIFEST" | tr -d '[:space:]')"
  [ -n "$mu" ] && { [ "$U" = "$mu" ] && ok "用户数与备份清单一致 ($U)" || no "用户数不一致：现在 $U，备份时 $mu"; }
  [ -n "$md" ] && { [ "$D" = "$md" ] && ok "文档数与备份清单一致 ($D)" || no "文档数不一致：现在 $D，备份时 $md"; }
  [ -n "$mc" ] && { [ "$C" = "$mc" ] && ok "片段数与备份清单一致 ($C)" || no "片段数不一致：现在 $C，备份时 $mc"; }
else
  info "没找到备份清单 $MANIFEST —— 无法与改造前的行数做对照，建议按手册第 1 步先备份"
fi

chk "pgvector 扩展已启用"  bash -c "docker exec '$DB' psql -U docmind -d docmind -tAc \"select extname from pg_extension\" | grep -qx vector"

hr "5. 数据库挂在哪个卷（确认不是空卷）"
VOL="$(docker inspect "$DB" --format '{{range .Mounts}}{{if eq .Destination "/var/lib/postgresql/data"}}{{.Name}}{{end}}{{end}}' 2>/dev/null)"
info "pgdata 卷: ${VOL:-读不到}"
if [ -n "$VOL" ] && docker volume inspect "$VOL" >/dev/null 2>&1; then
  ok "卷真实存在"
  info "路径: $(docker volume inspect "$VOL" --format '{{.Mountpoint}}')"
else
  no "读不到卷名 —— 请人工确认数据卷没有被换掉"
fi

hr "6. Nginx"
chk "nginx 已安装"      bash -c "command -v nginx"
chk "nginx 配置语法正确" nginx -t
chk "nginx 正在运行"     bash -c "systemctl is-active nginx | grep -qx active"
CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 -H "Host: $PUBLIC_HOST" http://127.0.0.1/api/health || echo 000)"
case "$CODE" in
  200) ok "经 nginx 访问 /api/health → 200" ;;
  301|302|308) ok "经 nginx 访问返回 $CODE（已配 HTTPS 跳转，正常）" ;;
  000) no "经 nginx 访问不通（curl 拿不到响应）" ;;
  *)   no "经 nginx 访问返回 $CODE（404 多半是 server_name 与 Host 不匹配）" ;;
esac

hr "7. 防火墙"
if command -v iptables >/dev/null 2>&1; then
  chk "DOCKER-USER 已封 5432" bash -c "iptables -S DOCKER-USER | grep -q 'dport 5432'"
  # 3000 不强制要求规则：应用已经不发布端口了（第 2 节已验证），
  # 没有规则才是正常状态。这里只做提示，不算失败。
  if iptables -S DOCKER-USER 2>/dev/null | grep -q 'dport 3000'; then
    ok "DOCKER-USER 已封 3000"
  else
    info "DOCKER-USER 没有 3000 规则 —— 不需要（应用已不再发布端口，见第 2 节）"
  fi
else
  no "没有 iptables"
fi
if command -v ufw >/dev/null 2>&1; then
  info "$(ufw status 2>/dev/null | head -1)  （可选：在有控制台访问时再考虑启用 ufw，先放行 22/80/443 再 enable，避免把自己关在门外）"
fi

hr "汇总"
echo "    通过 $pass 项，失败 $fail 项"
if [ "$fail" -eq 0 ]; then
  echo "    ✅ 全部通过"
  cat <<EOF

最后一步（脚本在服务器上做不了）：**从另一台机器**确认真的是"从外面进不来"：
    nc -vz -w3 $PUBLIC_HOST 5432     # 期望：超时 / 拒绝
    nc -vz -w3 $PUBLIC_HOST 3000     # 期望：超时 / 拒绝
    curl -I http://$PUBLIC_HOST/     # 期望：nginx 正常响应
另外去云厂商控制台确认安全组只放行 22/80/443（ufw/iptables 管不到它）。
EOF
  exit 0
else
  echo "    ❌ 有 $fail 项未通过 —— 先按上面的 FAIL 逐条修，别急着继续"
  exit 1
fi
