"use client";

import { useState } from "react";
import Link from "next/link";
import type { Job } from "@/lib/jobs";

type Match = { job: Job; reason: string };

export function ResumeRecommend() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPending(true);
    setError(null);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/jobs/recommend", {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "分析失败");
        setMatches([]);
      } else {
        setMatches(json.matches ?? []);
      }
    } catch {
      setError("分析失败，请重试");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="panel ui-rail p-6 pl-7">
      <h2 className="text-lg font-semibold text-fg">
        🎯 上传简历，智能推荐职位
      </h2>
      <p className="mt-1 text-sm text-muted-fg">
        AI 会分析你的简历，从职位库中推荐最匹配的岗位
      </p>

      <div className="mt-4">
        <label className="btn btn-primary cursor-pointer gap-2">
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
          <p className="mt-2 text-xs text-destructive-fg">{error}</p>
        )}
      </div>

      {matches.length > 0 && (
        <div className="mt-5 space-y-3">
          {matches.map(({ job, reason }, i) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="block card card-hover p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 font-semibold text-fg">
                  <span className="mr-1 num text-primary">
                    #{i + 1}
                  </span>
                  {job.title}
                  <span className="ml-2 text-sm font-normal text-muted-fg">
                    {job.company}
                  </span>
                </p>
                <span className="shrink-0 text-sm text-primary">
                  {job.salary}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-fg">
                {reason}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
