#!/bin/bash
# 把搜索引擎的 key 写进 .env（幂等：先删同名旧行再追加），全程只打印变量名与长度
set -uo pipefail
PART="${1:-/root/tavily.env.part}"
ENV_FILE=/home/admin/docmind/.env
cd /home/admin/docmind || exit 1

[ -f "$PART" ] || { echo "缺少 $PART"; exit 1; }
[ -f "$ENV_FILE" ] || { echo "找不到 $ENV_FILE"; exit 1; }

cp -a "$ENV_FILE" "/root/env.before-search.$(date +%s).bak"
echo "已备份原 .env"

grep -vE '^(SEARCH_PROVIDER|TAVILY_API_KEY|BRAVE_API_KEY|GOOGLE_API_KEY|GOOGLE_CSE_ID)=' "$ENV_FILE" > /tmp/env.new || true
cat "$PART" >> /tmp/env.new
cat /tmp/env.new > "$ENV_FILE"
rm -f /tmp/env.new
chmod 600 "$ENV_FILE"

echo
echo "=== .env 里的搜索配置（只显示变量名与值长度）==="
grep -E '^(SEARCH_PROVIDER|TAVILY_API_KEY|BRAVE_API_KEY|GOOGLE_API_KEY|GOOGLE_CSE_ID)=' "$ENV_FILE" |
  while IFS='=' read -r k v; do echo "  $k = 长度 ${#v}"; done

echo
echo "=== 重建应用容器（让它读到新变量）==="
docker compose -f deploy/03-app/docker-compose.app.yml up -d 2>&1 | tail -4
sleep 10
echo -n "容器内 TAVILY_API_KEY 长度："
docker exec docmind-app sh -c 'printf %s "$TAVILY_API_KEY" | wc -c'
echo -n "容器内 SEARCH_PROVIDER："
docker exec docmind-app sh -c 'printf %s "$SEARCH_PROVIDER"'
echo

echo
echo "=== 用这个 key 实测一次 Tavily 站内搜索（只看条数与标题，不打印 key）==="
KEY=$(grep '^TAVILY_API_KEY=' "$ENV_FILE" | cut -d= -f2-)
cat > /root/tavily-probe.json <<JSON
{"api_key":"$KEY","query":"(site:zhipin.com OR site:zhaopin.com) 前端开发 北京","max_results":3,"search_depth":"basic"}
JSON
curl -s --max-time 25 -X POST https://api.tavily.com/search \
  -H 'Content-Type: application/json' --data @/root/tavily-probe.json > /root/tavily-out.json 2>&1 || true
rm -f /root/tavily-probe.json

if command -v python3 >/dev/null 2>&1; then
  python3 - <<'PY'
import json
try:
    d = json.load(open("/root/tavily-out.json"))
except Exception as e:
    print("  解析失败：", str(e)[:120]); raise SystemExit
rs = d.get("results") or []
print("  返回结果条数：", len(rs))
for r in rs[:3]:
    print("   -", (r.get("title") or "")[:44], "|", (r.get("url") or "")[:72])
if not rs and d.get("detail"):
    print("  接口提示：", str(d.get("detail"))[:200])
PY
else
  echo -n "  url 出现次数："; grep -o '"url"' /root/tavily-out.json | wc -l
fi
rm -f /root/tavily-out.json

echo
echo "=== 完成 ==="
echo "（临时文件与本次用的 key 片段文件已删除）"
