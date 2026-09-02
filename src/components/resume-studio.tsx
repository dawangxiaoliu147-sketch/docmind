"use client";

import { useState } from "react";
import { RESUME_TEMPLATES } from "@/lib/resume-templates";

type ResumeData = {
  name: string;
  contact?: { age?: string; city?: string; phone?: string; email?: string };
  education?: Array<{ school: string; major: string; degree: string; time: string }>;
  experience?: Array<{ company: string; role: string; time: string; points: string[] }>;
  projects?: Array<{ name: string; role: string; time: string; points: string[] }>;
  skills?: Array<{ name: string; detail: string }>;
  strengths?: string[];
};

export function ResumeStudio() {
  const [selected, setSelected] = useState(RESUME_TEMPLATES[0]);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [info, setInfo] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resume, setResume] = useState<ResumeData | null>(null);

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

  function copyText() {
    if (!resume) return;
    const L: string[] = [
      `${resume.name}`,
      [resume.contact?.age, resume.contact?.city, resume.contact?.phone, resume.contact?.email]
        .filter(Boolean)
        .join(" ｜ "),
      "",
    ];
    if (resume.education?.length)
      L.push("教育背景", ...resume.education.map((e) => `${e.school} · ${e.major} · ${e.degree} · ${e.time}`), "");
    if (resume.experience?.length)
      L.push("实习经历", ...resume.experience.flatMap((e) => [`${e.company} · ${e.role} · ${e.time}`, ...e.points.map((p) => `- ${p}`), ""]));
    if (resume.projects?.length)
      L.push("项目经历", ...resume.projects.flatMap((p) => [`${p.name} · ${p.role} · ${p.time}`, ...p.points.map((pt) => `- ${pt}`), ""]));
    if (resume.skills?.length)
      L.push("证书技能", ...resume.skills.map((s) => `- ${s.name}：${s.detail}`), "");
    if (resume.strengths?.length)
      L.push("个人优势", ...resume.strengths.map((s, i) => `${i + 1}. ${s}`), "");
    navigator.clipboard.writeText(L.join("\n"));
  }

  function boldLead(text: string): string {
    const fi = text.indexOf("：");
    const idx = fi >= 0 ? fi : text.indexOf(":");
    if (idx > 0 && idx < 30) return `<strong>${text.slice(0, idx + 1)}</strong>${text.slice(idx + 1)}`;
    return text;
  }
  function entryRow(left: string, right: string): string {
    return `<table style="width:100%;border-collapse:collapse;margin:8px 0 2px;"><tr><td style="font-size:13px;color:#111;">${left}</td><td style="text-align:right;font-size:13px;color:#555;">${right}</td></tr></table>`;
  }
  function section(title: string, inner: string): string {
    return `<div style="margin:14px 0 0;"><h2 style="margin:0 0 6px;font-size:16px;color:#111;border-bottom:1.5px solid #ddd;padding-bottom:3px;">${title}</h2>${inner}</div>`;
  }
  function ulItems(items: string[]): string {
    return `<ul style="margin:2px 0 8px;padding-left:18px;">${items
      .map((i) => `<li style="font-size:12.5px;line-height:1.7;color:#333;">${boldLead(i)}</li>`)
      .join("")}</ul>`;
  }

  function buildHtml(): string {
    if (!resume) return "";
    const contact = [resume.contact?.age, resume.contact?.city, resume.contact?.phone, resume.contact?.email]
      .filter(Boolean)
      .join(" ｜ ");
    let body = "";
    if (resume.education?.length)
      body += section("教育背景", resume.education.map((e) => entryRow(`${e.school} · ${e.major} · ${e.degree}`, e.time)).join(""));
    if (resume.experience?.length)
      body += section("实习经历", resume.experience.map((e) => entryRow(`<strong>${e.company}</strong>`, `${e.role} · ${e.time}`) + ulItems(e.points)).join(""));
    if (resume.projects?.length)
      body += section("项目经历", resume.projects.map((p) => entryRow(`<strong>${p.name}</strong>`, `${p.role} · ${p.time}`) + ulItems(p.points)).join(""));
    if (resume.skills?.length)
      body += section("证书技能", ulItems(resume.skills.map((s) => `${s.name}：${s.detail}`)));
    if (resume.strengths?.length)
      body += section("个人优势", `<ol style="margin:2px 0 8px;padding-left:18px;">${resume.strengths.map((s) => `<li style="font-size:12.5px;line-height:1.7;color:#333;">${s}</li>`).join("")}</ol>`);
    return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${resume.name} 简历</title></head><body style="font-family:'Microsoft YaHei',sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#333;"><div style="border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:14px;"><h1 style="margin:0;font-size:26px;color:#111;">${resume.name}</h1><p style="margin:6px 0 0;font-size:13px;color:#555;">${contact}</p></div>${body}</body></html>`;
  }

  function buildMarkdown(): string {
    if (!resume) return "";
    const L: string[] = [`# ${resume.name}`, [resume.contact?.age, resume.contact?.city, resume.contact?.phone, resume.contact?.email].filter(Boolean).join(" | "), ""];
    if (resume.education?.length)
      L.push("## 教育背景", ...resume.education.map((e) => `- ${e.school} · ${e.major} · ${e.degree} · ${e.time}`), "");
    if (resume.experience?.length)
      L.push("## 实习经历", ...resume.experience.flatMap((e) => [`### ${e.company} · ${e.role} · ${e.time}`, ...e.points.map((p) => `- ${p}`), ""]));
    if (resume.projects?.length)
      L.push("## 项目经历", ...resume.projects.flatMap((p) => [`### ${p.name} · ${p.role} · ${p.time}`, ...p.points.map((pt) => `- ${pt}`), ""]));
    if (resume.skills?.length)
      L.push("## 证书技能", ...resume.skills.map((s) => `- **${s.name}：**${s.detail}`), "");
    if (resume.strengths?.length)
      L.push("## 个人优势", ...resume.strengths.map((s, i) => `${i + 1}. ${s}`), "");
    return L.join("\n");
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
    download(`${resume.name}简历.doc`, buildHtml(), "application/msword;charset=utf-8");
  }

  function downloadMarkdown() {
    if (!resume) return;
    download(`${resume.name}简历.md`, buildMarkdown(), "text/markdown;charset=utf-8");
  }

  function downloadPdf() {
    if (!resume) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(buildHtml());
    w.document.close();
    setTimeout(() => {
      w.focus();
      w.print();
    }, 500);
  }

  const inputCls =
    "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
  const c = selected.color;

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
              onClick={() => setSelected(t)}
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 左侧：表单 */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg text-white" style={{ backgroundColor: c }}>
              📝
            </span>
            <div>
              <h2 className="font-semibold dark:text-zinc-100">制作简历 · {selected.name}</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">直接填内容需求，AI 生成精美简历</p>
            </div>
          </div>

          <form onSubmit={submit} className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="姓名 *" className={inputCls} />
              <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="目标岗位 *（如：前端开发工程师）" className={inputCls} />
            </div>
            <textarea
              value={info}
              onChange={(e) => setInfo(e.target.value)}
              rows={7}
              placeholder={"直接粘贴/输入你的经历，例如：\n· 2021-2024 在某公司做前端，负责XX项目\n· 精通 Vue/React/TypeScript\n· 有 XX 年经验\n\n（留空则 AI 生成示例框架，用【】标注需替换处）"}
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

        {/* 右侧：简历预览 */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {!resume ? (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center text-zinc-400 dark:text-zinc-500">
              <div className="mb-3 text-4xl">📄</div>
              <p className="text-sm">填写左侧信息，点击「生成精美简历」</p>
              <p className="mt-1 text-xs">这里会实时预览你的简历</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
              {/* 简历头部 */}
              <div className="p-6" style={{ borderBottom: `3px solid ${c}` }}>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{resume.name}</h3>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {[resume.contact?.age, resume.contact?.city, resume.contact?.phone, resume.contact?.email]
                    .filter(Boolean)
                    .map((x, i) => (
                      <span key={i}>{x}</span>
                    ))}
                </div>
              </div>

              <div className="space-y-4 p-6">
                {resume.education && resume.education.length > 0 && (
                  <section>
                    <h4 className="mb-1 border-b border-zinc-200 pb-1 text-sm font-bold text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">教育背景</h4>
                    {resume.education.map((e, i) => (
                      <div key={i} className="text-sm">
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">{e.school}</span>
                        <span className="text-zinc-500 dark:text-zinc-400"> · {e.major} · {e.degree} · {e.time}</span>
                      </div>
                    ))}
                  </section>
                )}

                {resume.experience && resume.experience.length > 0 && (
                  <section>
                    <h4 className="mb-1 border-b border-zinc-200 pb-1 text-sm font-bold text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">实习经历</h4>
                    {resume.experience.map((e, i) => (
                      <div key={i} className="mb-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">{e.company}</span>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">{e.role} · {e.time}</span>
                        </div>
                        <ul className="mt-1 list-disc pl-4 text-sm text-zinc-600 dark:text-zinc-400">
                          {e.points.map((p, j) => <li key={j}>{p}</li>)}
                        </ul>
                      </div>
                    ))}
                  </section>
                )}

                {resume.projects && resume.projects.length > 0 && (
                  <section>
                    <h4 className="mb-1 border-b border-zinc-200 pb-1 text-sm font-bold text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">项目经历</h4>
                    {resume.projects.map((p, i) => (
                      <div key={i} className="mb-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">{p.name}</span>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">{p.role} · {p.time}</span>
                        </div>
                        <ul className="mt-1 list-disc pl-4 text-sm text-zinc-600 dark:text-zinc-400">
                          {p.points.map((pt, j) => <li key={j}>{pt}</li>)}
                        </ul>
                      </div>
                    ))}
                  </section>
                )}

                {resume.skills && resume.skills.length > 0 && (
                  <section>
                    <h4 className="mb-1 border-b border-zinc-200 pb-1 text-sm font-bold text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">证书技能</h4>
                    <ul className="list-disc pl-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {resume.skills.map((s, i) => <li key={i}><strong>{s.name}：</strong>{s.detail}</li>)}
                    </ul>
                  </section>
                )}

                {resume.strengths && resume.strengths.length > 0 && (
                  <section>
                    <h4 className="mb-1 border-b border-zinc-200 pb-1 text-sm font-bold text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">个人优势</h4>
                    <ol className="list-decimal pl-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {resume.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ol>
                  </section>
                )}
              </div>
            </div>
          )}

          {resume && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                💾 下载简历
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button onClick={downloadWord} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700">
                  📄 Word
                </button>
                <button onClick={downloadPdf} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700">
                  📕 PDF
                </button>
                <button onClick={downloadMarkdown} className="rounded-lg bg-zinc-800 px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-700">
                  📝 Markdown
                </button>
                <button onClick={copyText} className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                  📋 复制
                </button>
              </div>
              <p className="mt-2 text-[10px] text-zinc-400 dark:text-zinc-500">
                Word 用 Word 打开即可 · PDF 会打开打印对话框，选「另存为 PDF」
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
