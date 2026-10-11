#!/bin/bash
# 线上验证：页面里还会不会显示 markdown 星号（只读）
set -uo pipefail

echo "=== /ui 页（公开）里那句话的上下文 ==="
curl -s --max-time 10 http://127.0.0.1/ui | grep -o '.\{0,6\}不用登录也能验证.\{0,10\}' || echo "(没匹配到该句)"

echo
echo "=== /ui 页里所有连续两个星号的出现次数 ==="
curl -s --max-time 10 http://127.0.0.1/ui | grep -o '\*\*' | wc -l

echo
echo "=== 首页里的连续两个星号次数 ==="
curl -s --max-time 10 http://127.0.0.1/ | grep -o '\*\*' | wc -l

echo
echo "=== 首页里 markdown 式行首标题（## 开头）次数 ==="
curl -s --max-time 10 http://127.0.0.1/ | grep -oE '(^|>)#{2,} ' | wc -l

echo
echo "=== 构建产物里旧文案（应已消失）==="
echo -n "  **成长分** ："; grep -rc '\*\*成长分\*\*' /app/.next 2>/dev/null | grep -v ':0$' | head -3 || echo "0（已消失）"
echo -n "  **不依赖知识库** ："; grep -rc '\*\*不依赖知识库\*\*' /app/.next 2>/dev/null | grep -v ':0$' | head -3 || echo "0（已消失）"

echo
echo "=== 构建产物里新文案（应存在）==="
echo -n "  成长分决定 ："; grep -rc '成长分决定' /app/.next 2>/dev/null | grep -v ':0$' | head -2 || echo "(没找到)"
echo -n "  不依赖知识库 ："; grep -rc '这些助手不依赖知识库' /app/.next 2>/dev/null | grep -v ':0$' | head -2 || echo "(没找到)"
