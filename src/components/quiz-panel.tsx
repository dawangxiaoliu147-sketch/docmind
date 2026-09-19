"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Card } from "@/components/ui";

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
      "ui-row w-full cursor-pointer text-left text-sm disabled:cursor-default ";
    if (submitted) {
      if (oi === q.answer) {
        return base + "border-primary bg-accent text-primary";
      }
      if (answers[qi] === oi && oi !== q.answer) {
        return base + "border-destructive text-destructive-fg";
      }
      return base + "text-muted-fg";
    }
    return answers[qi] === oi
      ? base + "border-primary bg-accent text-primary"
      : base + "text-fg2";
  }

  return (
    <div className="space-y-5">
      {loading && (
        <Card className="p-10 text-center text-sm text-muted-fg">
          ◈ 正在根据你的文档出题…
        </Card>
      )}

      {error && (
        <Card className="p-10 text-center">
          <Alert tone="error">{error}</Alert>
          <Button className="mt-4" onClick={load}>
            重新出题
          </Button>
        </Card>
      )}

      {!loading && !error && questions.length > 0 && (
        <>
          {questions.map((q, qi) => (
            <Card key={qi} pad>
              <p className="font-semibold text-fg">
                <span className="num mr-2 text-primary">
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
                      ? "bg-accent text-primary"
                      : "text-destructive-fg"
                  }`}
                >
                  {answers[qi] === q.answer ? "✓ 答对了！" : "✗ 答错了。"}{" "}
                  <span className="text-muted-fg">
                    {q.explanation}
                  </span>
                </div>
              )}
            </Card>
          ))}

          {submitted ? (
            <Card pad className="flex items-center justify-between">
              <p className="text-lg font-semibold text-fg">
                <span className="num">得分：{score} / {questions.length}</span>
                <span className="num ml-2 text-sm font-normal text-muted-fg">
                  （{Math.round((score / questions.length) * 100)} 分）
                </span>
              </p>
              <Button onClick={load}>
                ≋ 再来一轮
              </Button>
            </Card>
          ) : (
            <Button
              size="lg"
              className="w-full"
              onClick={() => setSubmitted(true)}
              disabled={answeredCount < questions.length}
            >
              <span className="num">交卷（{answeredCount}/{questions.length}）</span>
            </Button>
          )}
        </>
      )}
    </div>
  );
}
