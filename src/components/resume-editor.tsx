"use client";

import { useRef, useState } from "react";

// 默认简历内容（对齐参考模板：照片 + 姓名标题 + 蓝色横幅 + 信息网格 + 蓝色分区标签）
const DEFAULT_HTML = `
<header class="rh">
  <div class="rh-photo" title="点击上传照片">点击<br>上传照片</div>
  <div class="rh-main">
    <h1 class="rh-name">全名简历</h1>
    <p class="rh-sub">求职意向：产品经理 ｜ 期望城市：上海</p>
    <div class="rh-grid">
      <span><b>年　龄</b>30 岁</span><span><b>性　别</b>男</span>
      <span><b>电　话</b>15888888888</span><span><b>邮　箱</b>qmjianli@qq.com</span>
      <span><b>学　历</b>本科</span><span><b>工作经验</b>6 年</span>
    </div>
  </div>
</header>
<section class="rsec"><div class="rsechead"><h2>教育背景</h2></div>
  <div class="ritem"><div class="rrow"><span class="rorg">某某大学 ｜ 工商管理 · 本科</span><span class="rmeta">2019.09 – 2023.06</span></div>
  <ul class="rdot"><li><span class="rk">专业课：</span>管理学、市场营销、统计学、财务管理等。</li></ul></div>
</section>
<section class="rsec"><div class="rsechead"><h2>工作经历</h2></div>
  <div class="ritem"><div class="rrow"><span class="rorg">某某科技有限公司 ｜ 产品经理</span><span class="rmeta">2023.07 – 至今</span></div>
  <ul class="rdot">
    <li><span class="rk">需求分析：</span>负责公司业务系统的需求调研与产品设计，输出 PRD 文档。</li>
    <li><span class="rk">项目推进：</span>协调研发、设计、测试团队，推动项目按期上线。</li>
  </ul></div>
</section>
<section class="rsec"><div class="rsechead"><h2>专业技能</h2></div>
  <ul class="rdot">
    <li><span class="rk">产品设计：</span>熟练使用 Axure、Figma 完成原型与交互设计。</li>
    <li><span class="rk">数据分析：</span>熟悉 SQL 与 Excel，能独立完成数据埋点与报表分析。</li>
  </ul>
</section>
<section class="rsec"><div class="rsechead"><h2>自我评价</h2></div>
  <p style="margin:0">性格踏实、责任心强，遇到问题习惯先理清思路再动手；乐于沟通协作，能快速适应新环境并持续学习。</p>
</section>
`.trim();

const SWATCHES = ["#1f4e79", "#2f6f5e", "#8a3b3b", "#3b3f46", "#2e75b6", "#7c3aed"];

export function ResumeEditor() {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [accent, setAccent] = useState("#1f4e79");
  const [editing, setEditing] = useState(false);
  const [agentOpen, setAgentOpen] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function currentHtml(): string {
    return bodyRef.current?.innerHTML ?? "";
  }

  function exportHtml() {
    const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>个人简历</title><style>${pageCss(accent)}</style></head><body><main class="page">${currentHtml()}</main></body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "个人简历.html";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function askAgent() {
    const text = prompt.trim();
    if (!text || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/resume/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: currentHtml(), prompt: text }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg(json.error ?? "修改失败");
      } else if (bodyRef.current) {
        bodyRef.current.innerHTML = json.html;
        setMsg("✅ 已按你的要求修改");
        setPrompt("");
      }
    } catch {
      setMsg("修改失败，请重试");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      {/* 工具条 */}
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-white p-2.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <button
          onClick={() => setEditing((v) => !v)}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
            editing ? "bg-emerald-600 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
        >
          {editing ? "✓ 完成编辑" : "✎ 编辑"}
        </button>
        <span className="text-xs text-zinc-400">主题色</span>
        {SWATCHES.map((c) => (
          <button
            key={c}
            onClick={() => setAccent(c)}
            className={`h-6 w-6 rounded-full border-2 transition ${
              accent === c ? "scale-110 border-zinc-800 dark:border-zinc-200" : "border-transparent"
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
        <input
          type="color"
          value={accent}
          onChange={(e) => setAccent(e.target.value)}
          className="h-6 w-6 cursor-pointer rounded border border-zinc-300 bg-white dark:border-zinc-700"
        />
        <span className="mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
        <button onClick={exportHtml} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
          导出 HTML
        </button>
        <button onClick={() => window.print()} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
          导出 PDF
        </button>
        <button onClick={() => setAgentOpen((v) => !v)} className="ml-auto rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-violet-700">
          {agentOpen ? "收起智能体" : "🤖 智能体改简历"}
        </button>
      </div>

      {/* A4 简历纸 */}
      <div className="overflow-x-auto">
        <style dangerouslySetInnerHTML={{ __html: pageCss(accent) }} />
        <main
          ref={bodyRef}
          className={`page ${editing ? "editing" : ""}`}
          contentEditable={editing}
          suppressContentEditableWarning
          spellCheck={false}
          dangerouslySetInnerHTML={{ __html: DEFAULT_HTML }}
        />
      </div>

      {/* 智能体小窗口 */}
      {agentOpen && (
        <div className="fixed bottom-24 right-5 z-30 w-80 overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-2xl dark:border-violet-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-white">
            <span className="text-sm font-semibold">🤖 简历智能体</span>
            <button onClick={() => setAgentOpen(false)} className="text-white/80 hover:text-white">✕</button>
          </div>
          <div className="p-3">
            <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
              说说你想怎么改，智能体会自动改在简历上👇
            </p>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="例如：把工作经历改成 3 年经验的产品经理，多加 2 条量化成果"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs outline-none focus:border-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <button
              onClick={askAgent}
              disabled={busy || !prompt.trim()}
              className="mt-2 w-full rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {busy ? "🪄 修改中…" : "🪄 让智能体修改"}
            </button>
            {msg && <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">{msg}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// 简历样式（对齐参考模板）
function pageCss(accent: string): string {
  return `
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  .page {
    width: 210mm; min-height: 297mm; margin: 0 auto; padding: 12mm 14mm;
    background: #fff; color: #1a1a1a; line-height: 1.5;
    font-family: "PingFang SC","Microsoft YaHei","Source Han Sans SC",system-ui,sans-serif;
    font-size: 10.5pt;
  }
  .page.editing { outline: 2px dashed #c7d2fe; outline-offset: 4px; }
  .rh { display: flex; gap: 14px; align-items: flex-start; }
  .rh-photo {
    width: 26mm; min-height: 32mm; flex: 0 0 auto; border: 1px solid #d8dee6; border-radius: 2px;
    display: flex; align-items: center; justify-content: center; text-align: center;
    color: #b9c2cd; font-size: 8pt; background: #fafbfc;
  }
  .rh-main { flex: 1 1 auto; min-width: 0; }
  .rh-name { margin: 0; font-size: 22pt; font-weight: 700; color: ${accent}; letter-spacing: 3px; }
  .rh-sub { margin: 2px 0 6px; font-size: 10pt; color: #3c4652; }
  .rh-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 20px; font-size: 9.5pt; color: #333; }
  .rh-grid b { color: #6b7480; font-weight: 600; margin-right: 6px; }
  .rh + .rsec, .rsec { margin-top: 12px; }
  .rh { border-bottom: 2px solid ${accent}; padding-bottom: 8px; }
  .rsechead { display: flex; align-items: center; gap: 10px; margin: 0 0 6px; }
  .rsechead::after { content: ""; flex: 1 1 auto; border-top: 1.4pt solid ${accent}; }
  .rsechead h2 {
    margin: 0; padding: 2px 18px 3px 10px; background: ${accent}; color: #fff;
    font-size: 11pt; font-weight: 700; letter-spacing: 2px; white-space: nowrap;
    clip-path: polygon(0 0, 100% 0, calc(100% - 7px) 100%, 0 100%);
  }
  .ritem { margin-bottom: 7px; }
  .rrow { display: flex; justify-content: space-between; gap: 12px; }
  .rorg { font-weight: 700; }
  .rmeta { flex: 0 0 auto; font-size: 9.5pt; color: #6b7480; white-space: nowrap; }
  .rdot { margin: 3px 0 0; padding-left: 0; list-style: none; }
  .rdot > li { position: relative; padding-left: 13px; margin: 2px 0; font-size: 10.5pt; color: #2b2b2b; }
  .rdot > li::before { content: ""; position: absolute; left: 2px; top: 0.62em; width: 4px; height: 4px; border-radius: 50%; background: ${accent}; }
  .rk { font-weight: 700; }
  @media print {
    body { margin: 0; }
    .page { width: auto; min-height: 0; margin: 0; padding: 12mm 14mm; }
  }
  `;
}
