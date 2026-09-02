"use client";

import { useState } from "react";
import { RESUME_TEMPLATES } from "@/lib/resume-templates";

type ResumeData = {
  name: string;
  title: string;
  contact?: { phone?: string; email?: string; location?: string };
  summary?: string;
  education?: Array<{ school: string; degree: string; time: string }>;
  experience?: Array<{ company: string; role: string; time: string; points: string[] }>;
  projects?: Array<{ name: string; points: string[] }>;
  skills?: string[];
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
    const lines: string[] = [
      `${resume.name} · ${resume.title}`,
      [resume.contact?.phone, resume.contact?.email, resume.contact?.location]
        .filter(Boolean)
        .join(" | "),
      "",
      resume.summary ?? "",
      "",
      "教育经历",
      ...(resume.education ?? []).map((e) => `${e.school} · ${e.degree} · ${e.time}`),
      "",
      "工作经历",
      ...(resume.experience ?? []).flatMap((e) => [
        `${e.company} · ${e.role} · ${e.time}`,
        ...e.points.map((p) => `- ${p}`),
      ]),
      "",
      "技能",
      (resume.skills ?? []).join(" / "),
    ];
    navigator.clipboard.writeText(lines.join("\n"));
  }

  function buildHtml(): string {
    if (!resume) return "";
    const c = selected.color;
    const contact = [resume.contact?.phone, resume.contact?.email, resume.contact?.location]
      .filter(Boolean)
      .join(" ｜ ");
    const sec = (title: string, inner: string) =>
      `<h3 style="margin:18px 0 8px;font-size:15px;color:${c};border-bottom:2px solid ${c};padding-bottom:4px;">${title}</h3>${inner}`;

    let body = "";
    if (resume.summary)
      body += sec("自我评价", `<p style="margin:0;line-height:1.7;">${resume.summary}</p>`);
    if (resume.education?.length)
      body += sec("教育经历", resume.education.map((e) => `<p style="margin:4px 0;"><strong>${e.school}</strong> · ${e.degree} · ${e.time}</p>`).join(""));
    if (resume.experience?.length)
      body += sec("工作经历", resume.experience.map((e) => `<p style="margin:8px 0 2px;"><strong>${e.company}</strong> · ${e.role} · ${e.time}</p><ul style="margin:0 0 8px;padding-left:20px;">${e.points.map((p) => `<li style="line-height:1.7;">${p}</li>`).join("")}</ul>`).join(""));
    if (resume.projects?.length)
      body += sec("项目经历", resume.projects.map((p) => `<p style="margin:8px 0 2px;"><strong>${p.name}</strong></p><ul style="margin:0 0 8px;padding-left:20px;">${p.points.map((pt) => `<li style="line-height:1.7;">${pt}</li>`).join("")}</ul>`).join(""));
    if (resume.skills?.length)
      body += sec("技能", `<p style="margin:0;">${resume.skills.join(" ／ ")}</p>`);

    return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${resume.name} 简历</title></head><body style="font-family:'Microsoft YaHei',sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#333;"><div style="border-bottom:3px solid ${c};padding-bottom:16px;margin-bottom:20px;"><h1 style="margin:0;font-size:26px;color:#111;">${resume.name}</h1><p style="margin:6px 0 0;font-size:16px;color:#444;">${resume.title}</p><p style="margin:8px 0 0;font-size:13px;color:#666;">${contact}</p></div><div style="padding:0;">${body}</div></body></html>`;
  }

  function buildMarkdown(): string {
    if (!resume) return "";
    const L: string[] = [`# ${resume.name} · ${resume.title}`, ""];
    const c = [resume.contact?.phone, resume.contact?.email, resume.contact?.location]
      .filter(Boolean)
      .join(" | ");
    if (c) L.push(c, "");
    if (resume.summary) L.push("## 自我评价", resume.summary, "");
    if (resume.education?.length)
      L.push("## 教育经历", ...resume.education.map((e) => `- ${e.school} · ${e.degree} · ${e.time}`), "");
    if (resume.experience?.length)
      L.push("## 工作经历", ...resume.experience.flatMap((e) => [`### ${e.company} · ${e.role} · ${e.time}`, ...e.points.map((p) => `- ${p}`), ""]));
    if (resume.projects?.length)
      L.push("## 项目经历", ...resume.projects.flatMap((p) => [`### ${p.name}`, ...p.points.map((pt) => `- ${pt}`), ""]));
    if (resume.skills?.length) L.push("## 技能", resume.skills.join(" / "), "");
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
                <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-300">{resume.title}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {[resume.contact?.phone, resume.contact?.email, resume.contact?.location]
                    .filter(Boolean)
                    .map((x, i) => (
                      <span key={i}>{x}</span>
                    ))}
                </div>
              </div>

              <div className="space-y-4 p-6">
                {resume.summary && (
                  <section>
                    <h4 className="mb-1 text-sm font-bold" style={{ color: c }}>自我评价</h4>
                    <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{resume.summary}</p>
                  </section>
                )}

                {resume.education && resume.education.length > 0 && (
                  <section>
                    <h4 className="mb-1 text-sm font-bold" style={{ color: c }}>教育经历</h4>
                    {resume.education.map((e, i) => (
                      <div key={i} className="text-sm">
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">{e.school}</span>
                        <span className="text-zinc-500 dark:text-zinc-400"> · {e.degree} · {e.time}</span>
                      </div>
                    ))}
                  </section>
                )}

                {resume.experience && resume.experience.length > 0 && (
                  <section>
                    <h4 className="mb-1 text-sm font-bold" style={{ color: c }}>工作经历</h4>
                    {resume.experience.map((e, i) => (
                      <div key={i} className="mb-2">
                        <div className="text-sm">
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">{e.company}</span>
                          <span className="text-zinc-500 dark:text-zinc-400"> · {e.role} · {e.time}</span>
                        </div>
                        <ul className="mt-1 list-disc pl-4 text-sm text-zinc-600 dark:text-zinc-400">
                          {e.points.map((p, j) => (
                            <li key={j}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </section>
                )}

                {resume.projects && resume.projects.length > 0 && (
                  <section>
                    <h4 className="mb-1 text-sm font-bold" style={{ color: c }}>项目经历</h4>
                    {resume.projects.map((p, i) => (
                      <div key={i} className="mb-2">
                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{p.name}</p>
                        <ul className="mt-1 list-disc pl-4 text-sm text-zinc-600 dark:text-zinc-400">
                          {p.points.map((pt, j) => (
                            <li key={j}>{pt}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </section>
                )}

                {resume.skills && resume.skills.length > 0 && (
                  <section>
                    <h4 className="mb-2 text-sm font-bold" style={{ color: c }}>技能</h4>
                    <div className="flex flex-wrap gap-2">
                      {resume.skills.map((s, i) => (
                        <span key={i} className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: c + "18", color: c }}>
                          {s}
                        </span>
                      ))}
                    </div>
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
