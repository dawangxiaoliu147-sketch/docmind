#!/usr/bin/env bash
# ============================================================
# DocMind 改造准备：**自动检测卷名并填进模板**
#
# 为什么要这个脚本：Docker 卷的真实名字是 `<compose 项目名>_<卷名>`，项目名一变，
# 填错就会挂到空卷上（界面看就是"数据全没了"）。与其让人猜，不如从**正在运行的容器**
# 上把它读出来 —— 这是唯一可靠的来源。
#
# 只写本地文件（两个 compose + 一个 nginx conf），不碰容器、不碰数据。
# 每次替换前会用 `cp -n` 留一份 .template.bak。
#
# 用法（在 deploy/ 目录下，先确保旧栈还在运行）：
#   bash 10-generate.sh 你的域名.com        # 有域名
#   bash 10-generate.sh 39.105.158.60       # 只有 IP
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
DOMAIN="${1:-}"

hr() { echo; echo "==> $*"; }

command -v docker >/dev/null 2>&1 || { echo "没装 docker" >&2; exit 1; }
docker info >/dev/null 2>&1 || { echo "docker 没在跑（或当前用户没权限，试试 sudo）" >&2; exit 1; }

hr "1/4 找数据库容器，读出它真实挂载的数据卷"
DB_CONTAINER="${DOCMIND_DB_CONTAINER:-}"
if [ -z "$DB_CONTAINER" ]; then
  # compose 生成的容器名可能带序号后缀（docmind-db 或 docmind-db-1）
  DB_CONTAINER="$(docker ps -a --format '{{.Names}}' | grep -E '^docmind-db(-[0-9]+)?$' | head -1 || true)"
fi
if [ -z "$DB_CONTAINER" ]; then
  DB_CONTAINER="$(docker ps -a --filter ancestor=pgvector/pgvector:pg16 --format '{{.Names}}' | head -1 || true)"
fi
if [ -z "$DB_CONTAINER" ]; then
  echo "找不到 PostgreSQL(pgvector) 容器。用 DOCMIND_DB_CONTAINER=容器名 指定后重跑。" >&2
  docker ps -a --format '  现有容器: {{.Names}}  ({{.Image}})' || true
  exit 1
fi
echo "    数据库容器: $DB_CONTAINER"

PGDATA_VOL="$(docker inspect "$DB_CONTAINER" \
  --format '{{range .Mounts}}{{if eq .Destination "/var/lib/postgresql/data"}}{{.Name}}{{end}}{{end}}')"
if [ -z "$PGDATA_VOL" ]; then
  echo "读不到 /var/lib/postgresql/data 对应的 named volume（是不是用了 bind mount？）" >&2
  docker inspect "$DB_CONTAINER" --format '    挂载: {{range .Mounts}}{{.Type}} {{.Name}}{{.Source}} -> {{.Destination}}; {{end}}'
  exit 1
fi
echo "    pgdata 卷: $PGDATA_VOL"
docker volume inspect "$PGDATA_VOL" --format '    实际路径: {{.Mountpoint}}
    创建时间: {{.CreatedAt}}'

hr "2/4 找应用容器，读出 uploads 卷"
APP_CONTAINER="${DOCMIND_APP_CONTAINER:-$(docker ps -a --format '{{.Names}}' | grep -E '^docmind-app(-[0-9]+)?$' | head -1 || true)}"
UPLOADS_VOL=""
if [ -n "$APP_CONTAINER" ]; then
  echo "    应用容器: $APP_CONTAINER"
  UPLOADS_VOL="$(docker inspect "$APP_CONTAINER" \
    --format '{{range .Mounts}}{{if eq .Destination "/app/public/uploads"}}{{.Name}}{{end}}{{end}}')"
fi
if [ -z "$UPLOADS_VOL" ]; then
  UPLOADS_VOL="$(docker volume ls --format '{{.Name}}' | grep -E 'uploads$' | head -1 || true)"
  [ -n "$UPLOADS_VOL" ] && echo "    应用容器没找到，按名字猜到 uploads 卷: $UPLOADS_VOL"
fi
if [ -z "$UPLOADS_VOL" ]; then
  echo "找不到 uploads 卷。用 UPLOADS_VOL=卷名 指定后重跑。" >&2
  docker volume ls
  exit 1
fi
echo "    uploads 卷: $UPLOADS_VOL"

hr "3/4 把卷名填进模板"
subst() {
  local file="$1" placeholder="$2" value="$3"
  [ -f "$file" ] || { echo "    !! 找不到 $file" >&2; return 1; }
  if grep -q "$placeholder" "$file"; then
    # 不写 `cp -n`：coreutils 会警告 "behavior of -n is non-portable"，噪音会污染自动化输出
    [ -f "$file.template.bak" ] || cp "$file" "$file.template.bak"
    sed -i "s|${placeholder}[^>]*>|${value}|" "$file"
    echo "    已填 $file  →  $value"
  else
    echo "    跳过 $file（没有 $placeholder 占位符，可能已填过）"
  fi
}
subst "01-db/docker-compose.db.yml"   "<FILL_ME_pgdata" "$PGDATA_VOL"
subst "03-app/docker-compose.app.yml" "<FILL_ME_uploads" "$UPLOADS_VOL"

hr "4/4 nginx 的 server_name"
NG="02-net/nginx/docmind.conf"
if [ -n "$DOMAIN" ]; then
  if grep -q "<你的域名" "$NG"; then
    [ -f "$NG.template.bak" ] || cp "$NG" "$NG.template.bak"
    sed -i "s|<你的域名或 39.105.158.60>|${DOMAIN}|g" "$NG"
    echo "    server_name 已设为: $DOMAIN"
  else
    echo "    跳过（占位符已不在，可能已填过）"
  fi
else
  echo "    !! 没传域名参数，nginx 里仍是占位符 <你的域名或 39.105.158.60>"
  echo "       重新跑：bash 10-generate.sh 你的域名.com"
fi

hr "生成结果自检"
echo "--- 数据库栈（重点看 pgdata 的 name 与 external，以及有没有 ports）---"
grep -nE "^\s*(name|external|ports):" 01-db/docker-compose.db.yml || true
echo
echo "--- 应用栈（重点看 uploads 的 name、docmind_net external、端口是否只在环回）---"
grep -nE "^\s*(name|external|ports):|127\.0\.0\.1:3000" 03-app/docker-compose.app.yml || true
echo
echo "--- 两个卷是否真实存在 ---"
for v in "$PGDATA_VOL" "$UPLOADS_VOL"; do
  if docker volume inspect "$v" >/dev/null 2>&1; then
    echo "    存在 ✓  $v"
  else
    echo "    不存在 ✗  $v  ← 千万别继续，先查清楚"
  fi
done

cat <<'EOF'

下一步（手册第 1 步起）：
  1) 先备份：        bash 01-db/backup.sh
  2) 停旧栈：        cd <旧项目目录> && docker compose down     # 绝不能加 -v
  3) 起数据库栈：    cd 01-db && docker compose -f docker-compose.db.yml up -d
  4) 立刻核对行数：  docker exec -it docmind-db psql -U docmind -d docmind -c "select count(*) from users;"
  5) 起应用栈：      cd ../03-app && docker compose -f docker-compose.app.yml up -d --build
  6) 装 nginx + 防火墙（手册第 5、6 步）
  7) 总验收：        bash ../99-verify.sh
EOF
