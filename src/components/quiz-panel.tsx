"use client";

import { useEffect, useState } from "react";

type Question = {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

export function QuizPanel({ kbId }: { kbId: string }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kbId]);

  async function load() {
    setLoading(true);
    setError(null);
    setSubmitted(false);
    setAnswers({});
    try {
      const res = await fetch(`/api/kb/${kbId}/quiz`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "出题失败");
        setQuestions([]);
      } else {
        setQuestions(json.questions ?? []);
      }
    } catch {
      setError("出题失败，请重试");
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }

  const answeredCount = Object.keys(answers).length;
  const score = questions.reduce(
    (acc, q, i) => acc + (answers[i] === q.answer ? 1 : 0),
    0,
  );

  function optionClass(q: Question, qi: number, oi: number): string {
    const base =
      "block w-full rounded-lg border px-4 py-2.5 text-left text-sm transition ";
    if (submitted) {
      if (oi === q.answer) {
        return base + "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
      }
      if (answers[qi] === oi && oi !== q.answer) {
        return base + "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300";
      }
      return base + "border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400";
    }
    return answers[qi] === oi
      ? base + "border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-600 dark:bg-indigo-950 dark:text-indigo-300"
      : base + "border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800";
  }

  return (
    <div className="space-y-5">
      {loading && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          🤔 正在根据你的文档出题…
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{error}</p>
          <button
            onClick={load}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            重新出题
          </button>
        </div>
      )}

      {!loading && !error && questions.length > 0 && (
        <>
          {questions.map((q, qi) => (
            <div
              key={qi}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <p className="font-semibold dark:text-zinc-100">
                <span className="mr-2 text-indigo-600 dark:text-indigo-400">
                  {qi + 1}.
                </span>
                {q.question}
              </p>
              <div className="mt-3 space-y-2">
                {q.options.map((opt, oi) => (
                  <button
                    key={oi}
                    type="button"
                    disabled={submitted}
                    onClick={() =>
                      setAnswers((prev) => ({ ...prev, [qi]: oi }))
                    }
                    className={optionClass(q, qi, oi)}
                  >
                    <span className="mr-2 font-medium">
                      {String.fromCharCode(65 + oi)}.
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
              {submitted && (
                <div
                  className={`mt-3 rounded-lg px-4 py-2.5 text-sm ${
                    answers[qi] === q.answer
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                  }`}
                >
                  {answers[qi] === q.answer ? "✅ 答对了！" : "❌ 答错了。"}{" "}
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {q.explanation}
                  </span>
                </div>
              )}
            </div>
          ))}

          {submitted ? (
            <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-lg font-semibold dark:text-zinc-100">
                得分：{score} / {questions.length}
                <span className="ml-2 text-sm font-normal text-zinc-500 dark:text-zinc-400">
                  （{Math.round((score / questions.length) * 100)} 分）
                </span>
              </p>
              <button
                onClick={load}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                🔄 再来一轮
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSubmitted(true)}
              disabled={answeredCount < questions.length}
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              交卷（{answeredCount}/{questions.length}）
            </button>
          )}
        </>
      )}
    </div>
  );
}
