"use client";

import { useState } from "react";

type Q = { question: string; answer: string };

export function JobInterview({ jobId }: { jobId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Q[]>([]);

  async function load() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/interview`);
      const json = await res.json();
      if (!res.ok) setError(json.error ?? "生成失败");
      else setQuestions(json.questions ?? []);
    } catch {
      setError("生成失败，请重试");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-lg font-semibold dark:text-zinc-100">🎤 模拟面试题</h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        AI 针对这个职位生成高频面试题 + 参考答案
      </p>

      {questions.length === 0 && (
        <button
          onClick={load}
          disabled={pending}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {pending ? "生成中…" : "🪄 生成面试题"}
        </button>
      )}

      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}

      {questions.length > 0 && (
        <div className="mt-4 space-y-2">
          {questions.map((q, i) => (
            <details key={i} className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
              <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-200">
                {i + 1}. {q.question}
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                💡 参考答案：{q.answer}
              </p>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
