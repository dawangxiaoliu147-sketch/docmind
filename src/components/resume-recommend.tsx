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
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-6 dark:border-indigo-900 dark:bg-indigo-950/30">
      <h2 className="text-lg font-semibold dark:text-zinc-100">
        🎯 上传简历，智能推荐职位
      </h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        AI 会分析你的简历，从职位库中推荐最匹配的岗位
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

      {matches.length > 0 && (
        <div className="mt-5 space-y-3">
          {matches.map(({ job, reason }, i) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="block rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-indigo-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-800"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold dark:text-zinc-100">
                  <span className="mr-1 text-indigo-600 dark:text-indigo-400">
                    #{i + 1}
                  </span>
                  {job.title}
                  <span className="ml-2 text-sm font-normal text-zinc-500 dark:text-zinc-400">
                    {job.company}
                  </span>
                </p>
                <span className="text-sm text-indigo-600 dark:text-indigo-400">
                  {job.salary}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {reason}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
