"use client";

import { useState } from "react";

export function KbSummary({ kbId }: { kbId: string }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/kb/${kbId}/summary`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "生成失败");
      } else {
        setSummary(json.summary);
      }
    } catch {
      setError("生成失败，请重试");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        onClick={generate}
        disabled={pending}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "生成中…" : "✨ AI 生成摘要"}
      </button>
      {summary && (
        <div className="mt-3 whitespace-pre-wrap rounded-xl bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          {summary}
        </div>
      )}
      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
