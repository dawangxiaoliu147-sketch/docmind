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
    <div className="card card-pad">
      <h2 className="mb-3 text-sm font-semibold text-fg">
        ◎ 跨知识库搜索
      </h2>
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="在所有知识库里搜索…"
          className="ui-field flex-1"
        />
        <button
          onClick={search}
          className="btn btn-primary btn-lg"
        >
          搜索
        </button>
      </div>

      {searched && (
        <div className="mt-4 space-y-2">
          {results.length === 0 ? (
            <p className="text-sm text-muted-fg">没有找到相关内容</p>
          ) : (
            results.map((r) => (
              <Link
                key={r.id}
                href={`/kb/${r.kbId}/docs/${r.docId}`}
                className="block rounded-lg border border-border bg-muted p-3 transition hover:bg-accent"
              >
                <p className="text-xs text-primary">
                  {r.kbName} · {r.docTitle}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-fg">
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
