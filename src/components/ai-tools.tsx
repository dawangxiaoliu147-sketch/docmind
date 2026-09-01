"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ToolKey = "flashcards" | "game" | "plan" | "daily" | "theme" | "recommend";

const TOOLS: { key: ToolKey; label: string; icon: string }[] = [
  { key: "flashcards", label: "AI 闪卡", icon: "🎴" },
  { key: "game", label: "知识闯关", icon: "🎮" },
  { key: "plan", label: "学习计划", icon: "📝" },
  { key: "daily", label: "每日一问", icon: "📅" },
  { key: "recommend", label: "推荐问题", icon: "🎯" },
  { key: "theme", label: "推荐主题色", icon: "🎨" },
];

export function AiTools({ kbId }: { kbId: string }) {
  const [type, setType] = useState<ToolKey | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [picked, setPicked] = useState<Record<number, string>>({});

  async function load(t: ToolKey) {
    setType(t);
    setPending(true);
    setError(null);
    setData(null);
    setPicked({});
    try {
      const res = await fetch(`/api/kb/${kbId}/generate?type=${t}`);
      const json = await res.json();
      if (!res.ok) setError(json.error ?? "生成失败");
      else setData(t === "plan" ? { plan: json.plan } : json.data);
    } catch {
      setError("生成失败，请重试");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {TOOLS.map((t) => (
          <button
            key={t.key}
            onClick={() => load(t.key)}
            disabled={pending}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
              type === t.key
                ? "bg-indigo-600 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {pending && <p className="mt-3 text-sm text-zinc-500">🪄 生成中…</p>}
      {error && <p className="mt-3 text-xs text-red-600 dark:text-red-400">{error}</p>}

      {data && type === "flashcards" && (
        <div className="mt-3 space-y-2">
          {(data as Array<{ front: string; back: string }>).map((c, i) => (
            <details key={i} className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
              <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-200">
                🎴 {c.front}
              </summary>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{c.back}</p>
            </details>
          ))}
        </div>
      )}

      {data && type === "game" && (
        <div className="mt-3 space-y-4">
          {(data as Array<{ question: string; options: string[]; answer: string; explanation: string }>).map(
            (q, i) => {
              const sel = picked[i];
              const correct = sel === q.answer;
              return (
                <div key={i} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                    {i + 1}. {q.question}
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {q.options.map((o, oi) => {
                      const letter = String.fromCharCode(65 + oi);
                      const isSel = sel === letter;
                      const isAns = q.answer === letter;
                      return (
                        <button
                          key={oi}
                          onClick={() => setPicked((p) => ({ ...p, [i]: letter }))}
                          disabled={sel !== undefined}
                          className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                            isSel
                              ? correct
                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
                                : "border-red-500 bg-red-50 dark:bg-red-950/40"
                              : isAns && sel !== undefined
                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
                                : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                          }`}
                        >
                          {letter}. {o}
                        </button>
                      );
                    })}
                  </div>
                  {sel !== undefined && (
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                      {correct ? "✅ 答对了！" : `❌ 正确答案是 ${q.answer}`} · {q.explanation}
                    </p>
                  )}
                </div>
              );
            },
          )}
        </div>
      )}

      {data && type === "plan" && (
        <div className="markdown mt-3 rounded-lg bg-zinc-50 p-4 text-sm text-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-200">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{(data as { plan: string }).plan}</ReactMarkdown>
        </div>
      )}

      {data && type === "daily" && (
        <div className="mt-3 rounded-xl bg-indigo-50 p-4 dark:bg-indigo-950/30">
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
            📅 {(data as { question: string }).question}
          </p>
          {(data as { hint?: string }).hint && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              提示：{(data as { hint: string }).hint}
            </p>
          )}
        </div>
      )}

      {data && type === "theme" && (
        <div className="mt-3 flex items-center gap-3">
          <span
            className="h-10 w-10 rounded-lg border border-zinc-200 dark:border-zinc-700"
            style={{ backgroundColor: (data as { color: string }).color }}
          />
          <div>
            <p className="text-sm font-mono text-zinc-700 dark:text-zinc-200">
              {(data as { color: string }).color}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {(data as { reason: string }).reason}
            </p>
          </div>
        </div>
      )}

      {data && type === "recommend" && (
        <ul className="mt-3 space-y-2">
          {(data as Array<{ question: string }>).map((q, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
              <span>🎯</span> {q.question}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
