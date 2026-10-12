#!/bin/bash
# 查 AI 配置是否存在（只报"有没有"和模型名，绝不打印密钥）
set -uo pipefail
cd /home/admin/docmind || exit 1

echo "=== 应用容器里的 AI 相关环境变量（只看有没有 + 模型名）==="
for k in AI_API_KEY AI_BASE_URL CHAT_MODEL VISION_MODEL EMBEDDING_MODEL; do
  v=$(docker exec docmind-app sh -c "printenv $k" 2>/dev/null || true)
  if [ -z "$v" ]; then
    echo "  $k = （未配置）"
  elif [ "$k" = "AI_API_KEY" ]; then
    echo "  $k = 已配置（长度 ${#v}，不显示内容）"
  elif [ "$k" = "AI_BASE_URL" ]; then
    host=$(echo "$v" | sed -E 's#https?://([^/]+).*#\1#')
    echo "  $k = 已配置（域名 $host）"
  else
    echo "  $k = $v"
  fi
done

echo
echo "=== 新路由是否已上线（404=还没换镜像，401=已上线）==="
echo -n "  /api/jobs/agent -> "; curl -s -o /dev/null -w '%{http_code}\n' --max-time 8 http://127.0.0.1/api/jobs/agent
echo -n "  /jobs/library   -> "; curl -s -o /dev/null -w '%{http_code}\n' --max-time 8 http://127.0.0.1/jobs/library
echo "  当前镜像: $(docker image inspect ghcr.io/dawangxiaoliu147-sketch/docmind:latest --format '{{.Created}}' 2>/dev/null)"
