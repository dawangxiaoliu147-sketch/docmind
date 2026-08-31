#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# DocMind Ubuntu/Debian 一键部署脚本（裸机 + Docker）
# 用法：在项目根目录执行  sudo bash scripts/deploy-ubuntu.sh
# ============================================================

echo "==> [1/4] 更新系统并安装基础依赖..."
apt-get update -y
apt-get install -y ca-certificates curl git

# 安装 Docker（若未安装）
if ! command -v docker >/dev/null 2>&1; then
  echo "==> [2/4] 安装 Docker..."
  curl -fsSL https://get.docker.com | sh
else
  echo "==> [2/4] Docker 已安装"
fi

# 安装 docker compose 插件（若未安装）
if ! docker compose version >/dev/null 2>&1; then
  echo "==> 安装 docker compose 插件..."
  apt-get install -y docker-compose-plugin
fi

# 切换到项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# 准备环境变量
if [ ! -f .env ]; then
  cp .env.example .env
  echo "!! 已生成 .env，请先编辑并填入 AUTH_SECRET 与 AI_API_KEY，然后重新运行本脚本"
  exit 1
fi

echo "==> [3/4] 构建并启动服务（含数据库）..."
docker compose up -d --build

echo "==> [4/4] 部署完成！"
docker compose ps
echo ""
echo "  应用地址： http://<服务器IP>:3000"
echo "  查看日志： docker compose logs -f app"
