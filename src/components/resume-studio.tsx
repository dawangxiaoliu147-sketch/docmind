"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RESUME_TEMPLATES } from "@/lib/resume-templates";
import {
  A4_HEIGHT_PX,
  A4_WIDTH_PX,
  buildResumeDocument,
  buildResumeMarkdown,
  buildResumePlainText,
  buildResumeWordDocument,
  type ResumeData,
  type ResumeLayout,
} from "@/lib/resume-print";

const LAYOUTS: Array<{ id: ResumeLayout; label: string; hint: string }> = [
  { id: "single", label: "单栏", hint: "自上而下，通用性最好" },
  { id: "two", label: "双栏", hint: "左侧联系方式+技能，右侧经历" },
  { id: "timeline", label: "时间轴", hint: "左侧竖线串联经历" },
];

export function ResumeStudio() {
  const [selected, setSelected] = useState(RESUME_TEMPLATES[0]);
  const [accent, setAccent] = useState(RESUME_TEMPLATES[0].color);
  const [layoutOverride, setLayoutOverride] = useState<ResumeLayout | null>(null);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [info, setInfo] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resume, setResume] = useState<ResumeData | null>(null);

  // A4 预览
  const boxRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(0.62);
  const [docHeight, setDocHeight] = useState(A4_HEIGHT_PX);

  /** 版式：模板自带优先，用户可在「版式」里单独覆盖 */
  const layout: ResumeLayout = layoutOverride ?? selected.layout ?? "single";

  /** 预览、打印、Word 共用同一份 HTML，保证所见即所得 */
  const doc = useMemo(
    () => (resume ? buildResumeDocument(resume, { accent, layout, target }) : ""),
    [resume, accent, layout, target],
  );

  // 预览区自适应缩放：按容器宽度等比缩到 A4 宽度以内
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / A4_WIDTH_PX));
    update();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [resume]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim() || !target.trim()) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/resume/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, target, info }),
      });
      const json = await res.json();
      if (!res.ok) setError(json.error ?? "生成失败");
      else setResume(json.resume);
    } catch {
      setError("生成失败，请重试");
    } finally {
      setPending(false);
    }
  }

  function download(filename: string, content: string, type: string) {
    const blob = new Blob(["\ufeff" + content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadWord() {
    if (!resume) return;
    download(
      `${resume.name}简历.doc`,
      buildResumeWordDocument(resume, { accent, layout, target }),
      "application/msword;charset=utf-8",
    );
  }

  function downloadMarkdown() {
    if (!resume) return;
    download(
      `${resume.name}简历.md`,
      buildResumeMarkdown(resume, { accent, layout, target }),
      "text/markdown;charset=utf-8",
    );
  }

  /** 直接打印 A4 预览 —— 打印的就是你看到的这一页 */
  function downloadPdf() {
    const win = frameRef.current?.contentWindow;
    if (!win) return;
    win.focus();
    win.print();
  }

  /** 兜底：在新窗口打开同一份 A4 文档（可自行 Ctrl+P 或另存） */
  function openStandalone() {
    if (!doc) return;
    const url = URL.createObjectURL(new Blob([doc], { type: "text/html;charset=utf-8" }));
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  function copyText() {
    if (!resume) return;
    navigator.clipboard.writeText(buildResumePlainText(resume, { accent, layout, target }));
  }

  const inputCls =
    "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
  const c = accent;
  const pages = Math.max(1, Math.ceil(docHeight / A4_HEIGHT_PX - 0.02));

  return (
    <div className="space-y-8">
      {/* 模板选择 */}
      <div>
        <h2 className="mb-3 text-sm font-semibold dark:text-zinc-100">
          🎨 选择简历模板（{RESUME_TEMPLATES.length} 套）
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RESUME_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setSelected(t);
                setAccent(t.color);
                setLayoutOverride(null);
              }}
              className={`group overflow-hidden rounded-2xl border text-left transition hover:-translate-y-1 hover:shadow-lg ${
                selected.id === t.id
                  ? "border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-900"
                  : "border-zinc-200 dark:border-zinc-800"
              }`}
            >
              <div className="h-20 w-full" style={{ backgroundColor: t.color }} />
              <div className="bg-white p-4 dark:bg-zinc-900">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">{t.name}</p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{t.style}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px]"
                    style={{ backgroundColor: t.color + "18", color: t.color }}
                  >
                    {LAYOUTS.find((l) => l.id === (t.layout ?? "single"))?.label}
                  </span>
                  {t.suitable.map((s) => (
                    <span
                      key={s}
                      className="rounded-full px-2 py-0.5 text-[10px]"
                      style={{ backgroundColor: t.color + "18", color: t.color }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 版式 & 强调色 */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          🧩 版式（模板自带，可单独覆盖）
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {LAYOUTS.map((l) => (
            <button
              key={l.id}
              type="button"
              title={l.hint}
              onClick={() => setLayoutOverride(l.id)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                layout === l.id
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                  : "border-zinc-300 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              {l.label}
            </button>
          ))}
          {layoutOverride && (
            <button
              type="button"
              onClick={() => setLayoutOverride(null)}
              className="text-xs text-zinc-400 underline hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              跟随模板（{LAYOUTS.find((l) => l.id === (selected.layout ?? "single"))?.label}）
            </button>
          )}
        </div>

        <p className="mb-2 mt-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          🎨 强调色（默认用模板色，可自定义）
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {[
            "#111827",
            "#1e40af",
            "#0f766e",
            "#9a3412",
            "#6d28d9",
            "#be185d",
            "#03700f",
            "#a16207",
            "#1e3a5f",
          ].map((col) => (
            <button
              key={col}
              type="button"
              onClick={() => setAccent(col)}
              className={`h-7 w-7 rounded-full border-2 transition ${
                accent === col ? "scale-110 border-indigo-500" : "border-transparent hover:scale-105"
              }`}
              style={{ backgroundColor: col }}
            />
          ))}
          <label className="relative flex h-7 w-7 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-zinc-300 text-xs text-zinc-400 transition hover:border-indigo-400 dark:border-zinc-700 dark:text-zinc-500">
            <span>🧬</span>
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="absolute opacity-0"
            />
          </label>
          <span
            className="ml-2 rounded-full px-3 py-1 text-xs font-medium text-white"
            style={{ backgroundColor: accent }}
          >
            {accent}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 左侧：表单 */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: c }}
            >
              📝
            </span>
            <div>
              <h2 className="font-semibold dark:text-zinc-100">制作简历 · {selected.name}</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">直接填内容需求，AI 生成精美简历</p>
            </div>
          </div>

          <form onSubmit={submit} className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="姓名 *"
                className={inputCls}
              />
              <input
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="目标岗位 *（如：前端开发工程师）"
                className={inputCls}
              />
            </div>
            <textarea
              value={info}
              onChange={(e) => setInfo(e.target.value)}
              rows={7}
              placeholder={
                "直接粘贴/输入你的经历，例如：\n· 2021-2024 在某公司做前端，负责XX项目\n· 精通 Vue/React/TypeScript\n· 有 XX 年经验\n\n（留空则 AI 生成示例框架，用【】标注需替换处）"
              }
              className={inputCls}
            />
            <button
              type="submit"
              disabled={pending || !name.trim() || !target.trim()}
              className="w-full rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {pending ? "🪄 生成中…" : "🪄 生成精美简历"}
            </button>
          </form>
          {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>

        {/* 右侧：A4 预览 */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {!resume ? (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center text-zinc-400 dark:text-zinc-500">
              <div className="mb-3 text-4xl">📄</div>
              <p className="text-sm">填写左侧信息，点击「生成精美简历」</p>
              <p className="mt-1 text-xs">这里会按 A4 真实尺寸预览，所见即打印</p>
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  🖨 A4 实时预览（{LAYOUTS.find((l) => l.id === layout)?.label}）
                </p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    pages > 1
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  }`}
                >
                  {pages > 1 ? `${pages} 页 · 建议精简到 1 页` : "正好 1 页 A4"}
                </span>
              </div>

              <div
                ref={boxRef}
                className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <div style={{ height: docHeight * scale, overflow: "hidden" }}>
                  <iframe
                    ref={frameRef}
                    srcDoc={doc}
                    title="简历 A4 预览"
                    onLoad={(e) => {
                      const d = e.currentTarget.contentDocument;
                      if (!d) return;
                      setDocHeight(Math.max(A4_HEIGHT_PX, d.documentElement.scrollHeight));
                    }}
                    style={{
                      width: A4_WIDTH_PX,
                      height: docHeight,
                      border: 0,
                      background: "#fff",
                      transform: `scale(${scale})`,
                      transformOrigin: "top left",
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {resume && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">💾 下载简历</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <button
                  onClick={downloadPdf}
                  className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
                >
                  📕 PDF（A4）
                </button>
                <button
                  onClick={downloadWord}
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
                >
                  📄 Word
                </button>
                <button
                  onClick={downloadMarkdown}
                  className="rounded-lg bg-zinc-800 px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-700"
                >
                  📝 Markdown
                </button>
                <button
                  onClick={openStandalone}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  ↗ 新窗口
                </button>
                <button
                  onClick={copyText}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  📋 复制
                </button>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-zinc-400 dark:text-zinc-500">
                PDF 直接打印上面的 A4 预览，打印对话框里选「另存为 PDF」，纸张 A4、边距选「无」。
                若打印窗口没有内容，点「↗ 新窗口」再 Ctrl+P。Word 打开即为 21×29.7cm、页边距 1.5cm。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
