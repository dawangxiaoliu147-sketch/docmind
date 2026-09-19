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
    <div className="panel p-6">
      <h2 className="text-lg font-semibold text-fg">
         匹配我的简历
      </h2>
      <p className="mt-1 text-sm text-muted-fg">
        上传简历，AI 分析你与这个职位的匹配度、优势和差距
      </p>

      <div className="mt-4">
        <label className="btn btn-primary cursor-pointer gap-2">
          {pending ? "分析中…" : " 上传简历"}
          <input
            type="file"
            accept=".pdf,.md,.txt,.markdown,.docx,.html,.htm,.csv,application/pdf,text/plain,text/markdown,text/html,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={onUpload}
            disabled={pending}
          />
        </label>
        {error && (
          <p className="mt-2 text-xs text-destructive-fg">{error}</p>
        )}
      </div>

      {analysis && (
        <div className="markdown mt-5 rounded-xl bg-muted p-5 text-fg2">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
