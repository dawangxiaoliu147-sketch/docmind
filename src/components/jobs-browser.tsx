"use client";

import { useState } from "react";
import Link from "next/link";
import type { Job } from "@/lib/jobs";

export function JobsBrowser({ jobs }: { jobs: Job[] }) {
  const [q, setQ] = useState("");

  const filtered = jobs.filter((j) => {
    const kw = q.trim().toLowerCase();
    if (!kw) return true;
    return (
      j.title.toLowerCase().includes(kw) ||
      j.company.toLowerCase().includes(kw) ||
      j.location.toLowerCase().includes(kw) ||
      j.tags.some((t) => t.toLowerCase().includes(kw))
    );
  });

  return (
    <div className="space-y-4">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="搜索职位 / 公司 / 技能 / 城市…"
        className="w-full max-w-md rounded-xl border border-zinc-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-indigo-500 dark:focus:ring-indigo-900"
      />

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-zinc-400 dark:text-zinc-500">
          没有匹配的职位
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((j) => (
            <Link
              key={j.id}
              href={`/jobs/${j.id}`}
              className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-800"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-zinc-900 group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400">
                  {j.title}
                </h3>
                <span className="rounded-lg bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  {j.salary}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {j.company} · {j.location}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {j.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
