"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function ResumeMatch({ jobId }: { jobId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPending(true);
    setError(null);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch(`/api/jobs/${jobId}/match`, {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "分析失败");
        setAnalysis(null);
      } else {
        setAnalysis(json.analysis);
      }
    } catch {
      setError("分析失败，请重试");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-lg font-semibold dark:text-zinc-100">
        🔍 匹配我的简历
      </h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        上传简历，AI 分析你与这个职位的匹配度、优势和差距
      </p>

      <div className="mt-4">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700">
          {pending ? "分析中…" : "📄 上传简历"}
          <input
            type="file"
            accept=".pdf,.md,.txt,.markdown,.docx,.html,.htm,.csv,application/pdf,text/plain,text/markdown,text/html,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={onUpload}
            disabled={pending}
          />
        </label>
        {error && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>

      {analysis && (
        <div className="markdown mt-5 rounded-xl bg-zinc-50 p-5 text-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-200">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
