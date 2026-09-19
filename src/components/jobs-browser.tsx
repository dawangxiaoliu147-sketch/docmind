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
        className="ui-field max-w-md"
        data-tour="jobs-search"
      />

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-fg">
          没有匹配的职位
        </p>
      ) : (
        <div className="card-grid">
          {filtered.map((j) => (
            <Link
              key={j.id}
              href={`/jobs/${j.id}`}
              className="group card card-hover card-pad"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="min-w-0 font-semibold text-fg group-hover:text-primary">
                  {j.title}
                </h3>
                <span className="chip chip-primary shrink-0">
                  {j.salary}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-fg">
                {j.company} · {j.location}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {j.tags.map((t) => (
                  <span key={t} className="chip">
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
