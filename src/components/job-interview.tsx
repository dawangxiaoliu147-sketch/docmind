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
    <div className="panel p-6">
      <h2 className="text-lg font-semibold text-fg">🎤 模拟面试题</h2>
      <p className="mt-1 text-sm text-muted-fg">
        AI 针对这个职位生成高频面试题 + 参考答案
      </p>

      {questions.length === 0 && (
        <button
          onClick={load}
          disabled={pending}
          className="btn btn-primary mt-4"
        >
          {pending ? "生成中…" : "🪄 生成面试题"}
        </button>
      )}

      {error && <p className="mt-2 text-xs text-destructive-fg">{error}</p>}

      {questions.length > 0 && (
        <div className="mt-4 space-y-2">
          {questions.map((q, i) => (
            <details key={i} className="rounded-lg bg-muted p-3">
              <summary className="cursor-pointer text-sm font-medium text-fg">
                {i + 1}. {q.question}
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-fg2">
                💡 参考答案：{q.answer}
              </p>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
