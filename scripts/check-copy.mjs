#!/usr/bin/env node
/**
 * 检查源码里有没有"markdown 写进了界面"。
 *
 * 为什么需要它：AI 生成文案时习惯写 markdown 加粗（`**这样**`），
 * 而 JSX 里那是纯文本 —— 星号会原样显示给用户。
 * 这个项目已经踩过 4 次（岛页成长分说明、工作台说明、知识库体检、/ui 分享卡片说明）。
 * 聊天回答走 react-markdown，不受影响；这里只管我们自己的 JSX 文案。
 *
 * 跑法：pnpm check:copy   （退出码 1 = 发现问题）
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.argv[2] || "src";

/** 把注释换成等量空行，保证行号不变，再看剩下的正文 */
function stripComments(src) {
  // 块注释（含 JSX 的 {/* ... */}）：整体替换，中间换行保留
  let out = src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
  // 行注释：只有 // 前面是行首或空白才算（避免把 https:// 当注释）
  out = out
    .split("\n")
    .map((line) => {
      const m = line.match(/(^|\s)\/\//);
      return m && m.index !== undefined ? line.slice(0, m.index + m[1].length) : line;
    })
    .join("\n");
  return out;
}

const RULES = [
  { name: "markdown 加粗（**这样**）", re: /\*\*[^*\s][^*]*\*\*/ },
  { name: "行首的 ** 残留", re: /^\s*\*\*\S/ },
  { name: "markdown 链接（[文字](http…)）", re: /\[[^\]\n]{2,}\]\(https?:\/\// },
  { name: "markdown 标题（## 这样）", re: /(?:^|\s)#{2,}\s+\S/ },
];

/**
 * 提示词里的 markdown 是正常的（发给模型，不显示给用户）。
 * 这类段落用下面这对标记排除：
 *   // @copy-check-ignore-start
 *   ...
 *   // @copy-check-ignore-end
 */
const IGNORE_START = /@copy-check-ignore-start/;
const IGNORE_END = /@copy-check-ignore-end/;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(p)) out.push(p);
  }
  return out;
}

const bad = [];
const files = walk(ROOT);
for (const file of files) {
  const original = readFileSync(file, "utf8");
  // 标记要在**原始行**上认（它本身是注释，去注释后就被删掉了）
  const originalLines = original.split("\n");
  const strippedLines = stripComments(original).split("\n");

  let ignoring = false;
  for (let i = 0; i < originalLines.length; i++) {
    if (IGNORE_START.test(originalLines[i])) {
      ignoring = true;
      continue;
    }
    if (IGNORE_END.test(originalLines[i])) {
      ignoring = false;
      continue;
    }
    if (ignoring) continue;

    const line = strippedLines[i] ?? "";
    for (const rule of RULES) {
      if (rule.re.test(line)) {
        bad.push({ file, line: i + 1, rule: rule.name, text: line.trim().slice(0, 100) });
        break;
      }
    }
  }
}

if (bad.length === 0) {
  console.log(`✓ 没有发现写进界面的 markdown（检查了 ${files.length} 个文件）`);
  process.exit(0);
}

console.log(`✗ 发现 ${bad.length} 处会被原样显示出来的 markdown：`);
for (const b of bad) console.log(`  ${b.file}:${b.line}  [${b.rule}]  ${b.text}`);
console.log("\n提示：JSX 里要用 <strong> / <a> / 普通文字，不要写 markdown。");
process.exit(1);
