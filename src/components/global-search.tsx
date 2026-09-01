"use client";

import { useState } from "react";
import Link from "next/link";

type Result = {
  id: string;
  kbId: string;
  docId: string;
  content: string;
  docTitle: string;
  kbName: string;
};

export function GlobalSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [searched, setSearched] = useState(false);

  async function search() {
    if (!q.trim()) return;
    setSearched(true);
    try {
      const res = await fetch(`/api/search-all?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      setResults(Array.isArray(json.results) ? json.results : []);
    } catch {
      setResults([]);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-3 text-sm font-semibold dark:text-zinc-100">
        🔍 跨知识库搜索
      </h2>
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="在所有知识库里搜索…"
          className="flex-1 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <button
          onClick={search}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          搜索
        </button>
      </div>

      {searched && (
        <div className="mt-4 space-y-2">
          {results.length === 0 ? (
            <p className="text-sm text-zinc-400">没有找到相关内容</p>
          ) : (
            results.map((r) => (
              <Link
                key={r.id}
                href={`/kb/${r.kbId}/docs/${r.docId}`}
                className="block rounded-xl bg-zinc-50 p-3 transition hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800"
              >
                <p className="text-xs text-indigo-600 dark:text-indigo-400">
                  {r.kbName} · {r.docTitle}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {r.content}
                </p>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
