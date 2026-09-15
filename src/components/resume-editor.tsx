"use client";

import { useEffect, useRef, useState } from "react";

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
  const photoRef = useRef<HTMLInputElement>(null);
  const [accent, setAccent] = useState("#1f4e79");
  const [tpl, setTpl] = useState<string>("ribbon");
  const [editing, setEditing] = useState(false);
  const [agentOpen, setAgentOpen] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [srcName, setSrcName] = useState<string | null>(null);
  const [srcText, setSrcText] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pages, setPages] = useState(1);
  const abortRef = useRef<AbortController | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [saved, setSaved] = useState<{ id: string; title: string }[]>([]);
  const [curId, setCurId] = useState<string | null>(null);
  const [libOpen, setLibOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  function currentHtml(): string {
    return bodyRef.current?.innerHTML ?? "";
  }

  // 点照片框 → 选图 → 内联到简历里
  function onPageClick(e: React.MouseEvent<HTMLElement>) {
    const hit = (e.target as HTMLElement).closest(".rh-photo");
    if (hit) photoRef.current?.click();
  }

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const photo = bodyRef.current?.querySelector<HTMLElement>(".rh-photo");
      if (!photo) return;
      // 用 <img> 而不是背景图：打印/导出 PDF 更可靠
      photo.innerHTML = `<img src="${reader.result}" alt="照片" style="width:100%;height:100%;object-fit:cover;display:block;" />`;
      photo.style.padding = "0";
      photo.style.borderColor = "transparent";
      photo.style.background = "none";
    };
    reader.readAsDataURL(file);
    e.target.value = "";
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

  // 估算页数 + 自动缩到一页（A4 内容高度约 1122px @96dpi）
  const A4_PX = 1100;

  function measurePages(): number {
    const el = bodyRef.current;
    if (!el) return 1;
    const prev = el.style.minHeight;
    el.style.minHeight = "0";
    const h = el.scrollHeight;
    el.style.minHeight = prev;
    const n = Math.max(1, Math.ceil(h / A4_PX - 0.02));
    setPages(n);
    return n;
  }

  function fitOnePage() {
    const el = bodyRef.current;
    if (!el) return;
    setZoom(1);
    requestAnimationFrame(() => {
      const target = bodyRef.current;
      if (!target) return;
      const prev = target.style.minHeight;
      target.style.minHeight = "0";
      const h = target.scrollHeight;
      target.style.minHeight = prev;
      if (h > A4_PX) {
        setZoom(Math.max(0.62, Number((A4_PX / h).toFixed(3))));
      }
      setMsg("📏 已自动适配到一页");
      setTimeout(measurePages, 60);
    });
  }

  // 挂载/切模板/缩放变化时，自动校验页数
  useEffect(() => {
    const t = setTimeout(measurePages, 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tpl, zoom]);

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg(null);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/assistant/upload", { method: "POST", body: data });
      const json = await res.json();
      if (!res.ok) {
        setMsg(json.error ?? "解析失败");
      } else {
        setSrcName(json.fileName);
        setSrcText(json.text);
        setMsg("📎 资料已读取，说说你想怎么用");
      }
    } catch {
      setMsg("解析失败，请重试");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function askAgent() {
    const text = prompt.trim();
    if (!text || busy) return;
    setBusy(true);
    setMsg(null);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch("/api/resume/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: currentHtml(),
          prompt: text,
          tpl,
          accent,
          source: srcText ?? "",
          image: imageData ?? "",
        }),
        signal: ctrl.signal,
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg(json.error ?? "修改失败");
      } else if (bodyRef.current) {
        bodyRef.current.innerHTML = json.html;
        if (json.tpl) setTpl(json.tpl);
        if (json.accent) setAccent(json.accent);
        setMsg("✅ 已按你的要求修改");
        setPrompt("");
      }
    } catch (err) {
      if ((err as Error)?.name === "AbortError") setMsg("⏹ 已停止修改");
      else setMsg("修改失败，请重试");
    } finally {
      setBusy(false);
      abortRef.current = null;
      setTimeout(measurePages, 80);
    }
  }

  function stopAgent() {
    abortRef.current?.abort();
  }

  function onImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageData(reader.result as string);
      setImageName(file.name);
      setMsg("🖼️ 图片已读入，说说你要从中提炼什么");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  /* ---------- 简历库 ---------- */
  async function loadList() {
    try {
      const res = await fetch("/api/resumes");
      const json = await res.json();
      setSaved(Array.isArray(json.resumes) ? json.resumes : []);
    } catch {
      setSaved([]);
    }
  }

  async function saveResume() {
    const el = bodyRef.current;
    if (!el || saving) return;
    const title = window.prompt("简历名称", "我的简历");
    if (!title || !title.trim()) return;
    setSaving(true);
    try {
      const payload = { title: title.trim(), html: el.innerHTML, tpl, accent };
      const res = await fetch(curId ? `/api/resumes/${curId}` : "/api/resumes", {
        method: curId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg(json.error ?? "保存失败");
      } else {
        if (!curId && json.id) setCurId(json.id);
        setMsg("💾 已保存到简历库");
        loadList();
      }
    } catch {
      setMsg("保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function openResume(id: string) {
    setLibOpen(false);
    try {
      const res = await fetch(`/api/resumes/${id}`);
      const json = await res.json();
      if (!res.ok) {
        setMsg(json.error ?? "读取失败");
        return;
      }
      if (bodyRef.current) bodyRef.current.innerHTML = json.resume.html;
      setTpl(json.resume.tpl);
      setAccent(json.resume.accent);
      setCurId(id);
      setMsg(`📂 已打开：${json.resume.title}`);
      setTimeout(measurePages, 120);
    } catch {
      setMsg("读取失败");
    }
  }

  function newResume() {
    if (bodyRef.current) bodyRef.current.innerHTML = DEFAULT_HTML;
    setTpl("ribbon");
    setAccent("#1f4e79");
    setCurId(null);
    setLibOpen(false);
    setMsg("🆕 已新建空白简历");
  }

  async function delResume(id: string) {
    await fetch(`/api/resumes/${id}`, { method: "DELETE" });
    if (curId === id) setCurId(null);
    loadList();
  }

  return (
    <div>
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
        <span className="text-xs text-zinc-400">模板</span>
        {([
          ["ribbon", "缎带标签"],
          ["bar", "蓝底标签"],
          ["gray", "灰底标签"],
          ["underline", "下划线"],
          ["dark", "深色头部"],
          ["topbar", "顶部色条"],
          ["right", "照片在右"],
          ["center", "居中标题"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTpl(id)}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              tpl === id
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {label}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
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
        <button onClick={fitOnePage} className="rounded-lg border border-emerald-300 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950">
          📏 适配一页
        </button>
        <span className={`text-xs font-medium ${pages > 1 ? "text-amber-600" : "text-emerald-600"}`}>
          {pages > 1 ? `⚠ 约 ${pages} 页` : "✓ 1 页 A4"}
        </span>
        <div className="relative">
          <button
            onClick={saveResume}
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? "保存中…" : "💾 保存"}
          </button>
          <button
            onClick={() => {
              setLibOpen((v) => !v);
              loadList();
            }}
            className="ml-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            📚 简历库
          </button>
          {libOpen && (
            <div className="absolute left-0 top-full z-30 mt-1 w-64 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
              <button
                onClick={newResume}
                className="block w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                🆕 新建空白简历
              </button>
              <div className="max-h-64 overflow-y-auto border-t border-zinc-100 dark:border-zinc-800">
                {saved.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-zinc-400">还没有保存的简历</p>
                ) : (
                  saved.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-1 border-b border-zinc-50 px-2 py-1.5 last:border-0 dark:border-zinc-800/60"
                    >
                      <button
                        onClick={() => openResume(r.id)}
                        className="min-w-0 flex-1 truncate rounded px-1 py-1 text-left text-sm text-zinc-700 hover:text-indigo-600 dark:text-zinc-200"
                      >
                        {r.title}
                      </button>
                      <button
                        onClick={() => delResume(r.id)}
                        className="shrink-0 px-1 text-xs text-zinc-300 hover:text-red-500"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button onClick={() => setAgentOpen((v) => !v)} className="ml-auto rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-violet-700">
          {agentOpen ? "收起智能体" : "🤖 智能体改简历"}
        </button>
      </div>

      {/* A4 简历纸 */}
      <div className="overflow-x-auto">
        <style dangerouslySetInnerHTML={{ __html: pageCss(accent) }} />
        <main
          ref={bodyRef}
          className={`page tpl-${tpl} ${editing ? "editing" : ""}`}
          style={{ zoom }}
          contentEditable={editing}
          suppressContentEditableWarning
          spellCheck={false}
          onClick={onPageClick}
          dangerouslySetInnerHTML={{ __html: DEFAULT_HTML }}
        />
        <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
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
              上传资料或直接说需求，智能体会自动改在简历上👇
            </p>

            {srcName && (
              <div className="mb-2 flex items-center justify-between rounded-lg bg-zinc-100 px-2 py-1.5 text-xs dark:bg-zinc-800">
                <span className="truncate text-zinc-600 dark:text-zinc-300">📎 {srcName}</span>
                <button
                  onClick={() => {
                    setSrcName(null);
                    setSrcText(null);
                  }}
                  className="ml-2 shrink-0 text-zinc-400 hover:text-red-500"
                >
                  移除
                </button>
              </div>
            )}

            <label className="mb-2 flex cursor-pointer items-center justify-center gap-1 rounded-lg border border-dashed border-zinc-300 py-2 text-xs text-zinc-500 transition hover:border-violet-400 hover:text-violet-600 dark:border-zinc-700 dark:text-zinc-400">
              {uploading ? "解析中…" : "📎 上传简历 / 经历资料（可选）"}
              <input
                type="file"
                accept=".pdf,.docx,.md,.txt,.markdown,.html,.htm,.csv,application/pdf,text/plain,text/markdown,text/html,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={onUpload}
                disabled={uploading}
              />
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="例如：把工作经历改成 3 年经验的产品经理，多加 2 条量化成果"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs outline-none focus:border-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            {imageName && (
              <div className="mb-2 flex items-center justify-between rounded-lg bg-zinc-100 px-2 py-1.5 text-xs dark:bg-zinc-800">
                <span className="truncate text-zinc-600 dark:text-zinc-300">🖼️ {imageName}</span>
                <button
                  onClick={() => {
                    setImageData(null);
                    setImageName(null);
                  }}
                  className="ml-2 shrink-0 text-zinc-400 hover:text-red-500"
                >
                  移除
                </button>
              </div>
            )}

            <label className="mb-2 flex cursor-pointer items-center justify-center gap-1 rounded-lg border border-dashed border-zinc-300 py-2 text-xs text-zinc-500 transition hover:border-violet-400 hover:text-violet-600 dark:border-zinc-700 dark:text-zinc-400">
              🖼️ 上传图片（识图，可选）
              <input type="file" accept="image/*" className="hidden" onChange={onImage} />
            </label>

            <div className="mt-2 flex gap-2">
              <button
                onClick={askAgent}
                disabled={busy || !prompt.trim()}
                className="flex-1 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {busy ? "🪄 修改中…" : "🪄 让智能体修改"}
              </button>
              {busy && (
                <button
                  onClick={stopAgent}
                  className="rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                >
                  ⏹ 停止
                </button>
              )}
            </div>
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
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page.editing { outline: 2px dashed #c7d2fe; outline-offset: 4px; }
  .rh { display: flex; gap: 14px; align-items: flex-start; }
  .rh-photo {
    width: 26mm; min-height: 32mm; flex: 0 0 auto; border: 1px solid #d8dee6; border-radius: 2px;
    display: flex; align-items: center; justify-content: center; text-align: center;
    color: #b9c2cd; font-size: 8pt; background: #fafbfc; overflow: hidden;
  }
  .rh-photo img { display: block; width: 100%; height: 100%; object-fit: cover; }
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

  /* ---- 模板：蓝底整条标签 ---- */
  .tpl-bar .rsechead::after { display: none; }
  .tpl-bar .rsechead h2 { background: ${accent}; color: #fff; clip-path: none; display: block; width: 100%; padding: 3px 10px; }
  /* ---- 模板：灰底标签 ---- */
  .tpl-gray .rsechead::after { display: none; }
  .tpl-gray .rsechead h2 { background: #eef1f5; color: #2b2b2b; clip-path: none; display: block; width: 100%; padding: 3px 10px; }
  /* ---- 模板：下划线标题 ---- */
  .tpl-underline .rsechead::after { display: none; }
  .tpl-underline .rsechead h2 { background: none; color: ${accent}; clip-path: none; padding: 2px 0 3px; border-bottom: 2px solid ${accent}; }
  /* ---- 模板：深色头部 ---- */
  .tpl-dark .rh { background: ${accent}; padding: 12px; border-radius: 4px; border-bottom: 0; }
  .tpl-dark .rh-name { color: #fff; }
  .tpl-dark .rh-sub, .tpl-dark .rh-grid { color: rgba(255,255,255,.92); }
  .tpl-dark .rh-grid b { color: rgba(255,255,255,.72); }
  .tpl-dark .rh-photo { border-color: rgba(255,255,255,.45); background: rgba(255,255,255,.12); color: rgba(255,255,255,.75); }
  /* ---- 模板：顶部色条 ---- */
  .tpl-topbar .rh { border-top: 10px solid ${accent}; }
  /* ---- 模板：照片在右 ---- */
  .tpl-right .rh { flex-direction: row-reverse; }
  /* ---- 模板：居中标题（只居中顶部标题，分区保持正常） ---- */
  .tpl-center .rh { flex-direction: column; align-items: center; text-align: center; }
  .tpl-center .rh-grid { width: 100%; text-align: left; margin-top: 4px; }
  @media print {
    html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; height: auto !important; }
    /* 只打印简历本身：隐藏工具栏、智能体窗口、导航等所有界面 */
    body * { visibility: hidden !important; }
    .page, .page * { visibility: visible !important; }
    .page {
      position: fixed !important; left: 0 !important; top: 0 !important; right: auto !important; bottom: auto !important;
      width: 210mm !important; min-height: 0 !important; max-height: none !important;
      margin: 0 !important; padding: 8mm 13mm !important;
      box-shadow: none !important; outline: none !important; border: 0 !important;
      overflow: visible !important; background: #fff !important;
    }
    /* 页头不要多余外边距 */
    .page .rh { margin-top: 0 !important; }
  }
  `;
}
