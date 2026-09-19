"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Alert, Button, Card, IconBox, Panel } from "@/components/ui";

type ToolKey = "flashcards" | "game" | "plan" | "daily" | "theme" | "recommend";

/** /api/kb/[id]/generate 返回的六种载荷（纯类型，运行时逻辑未变） */
type ToolPayload =
  | { front: string; back: string }[]
  | { question: string; options: string[]; answer: string; explanation: string }[]
  | { plan: string }
  | { question: string; hint?: string }
  | { color: string; reason: string }
  | { question: string }[]
  | null;

const TOOLS: { key: ToolKey; label: string; icon: string }[] = [
  { key: "flashcards", label: "AI 闪卡", icon: "⊟" },
  { key: "game", label: "知识闯关", icon: "◐" },
  { key: "plan", label: "学习计划", icon: "≣" },
  { key: "daily", label: "每日一问", icon: "☉" },
  { key: "recommend", label: "推荐问题", icon: "◎" },
  { key: "theme", label: "推荐主题色", icon: "◨" },
];

export function AiTools({ kbId }: { kbId: string }) {
  const [type, setType] = useState<ToolKey | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ToolPayload>(null);
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
          <Button
            key={t.key}
            size="sm"
            variant={type === t.key ? "default" : "outline"}
            onClick={() => load(t.key)}
            disabled={pending}
          >
            {t.icon} {t.label}
          </Button>
        ))}
      </div>

      {pending && <p className="mt-3 text-sm text-muted-fg">生成中…</p>}
      {error && (
        <Alert tone="error" className="mt-3">
          {error}
        </Alert>
      )}

      {data && type === "flashcards" && (
        <div className="mt-3 space-y-2">
          {(data as Array<{ front: string; back: string }>).map((c, i) => (
            <Card key={i} className="p-3">
              <details>
                <summary className="cursor-pointer text-sm font-medium text-fg2">
                  ⊟ {c.front}
                </summary>
                <p className="mt-2 text-sm text-muted-fg">{c.back}</p>
              </details>
            </Card>
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
                <Card key={i} className="p-4">
                  <p className="text-sm font-medium text-fg">
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
                          className={`ui-row w-full cursor-pointer text-left text-sm disabled:cursor-default ${
                            isSel
                              ? correct
                                ? "border-primary bg-accent text-primary"
                                : "border-destructive text-destructive-fg"
                              : isAns && sel !== undefined
                                ? "border-primary bg-accent text-primary"
                                : "text-fg2"
                          }`}
                        >
                          {letter}. {o}
                        </button>
                      );
                    })}
                  </div>
                  {sel !== undefined && (
                    <p className="mt-2 text-xs text-muted-fg">
                      <span className={correct ? "text-primary" : "text-destructive-fg"}>
                        {correct ? "✓ 答对了！" : `✗ 正确答案是 ${q.answer}`}
                      </span>{" "}
                      · {q.explanation}
                    </p>
                  )}
                </Card>
              );
            },
          )}
        </div>
      )}

      {data && type === "plan" && (
        <div className="markdown card mt-3 p-4 text-sm text-fg2">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{(data as { plan: string }).plan}</ReactMarkdown>
        </div>
      )}

      {data && type === "daily" && (
        <Panel className="ui-rail mt-3 p-4 pl-5">
          <p className="text-sm font-medium text-fg">
            ☉ {(data as { question: string }).question}
          </p>
          {(data as { hint?: string }).hint && (
            <p className="mt-1 text-xs text-muted-fg">
              提示：{(data as { hint: string }).hint}
            </p>
          )}
        </Panel>
      )}

      {data && type === "theme" && (
        <div className="mt-3 flex items-center gap-3">
          <span
            className="h-10 w-10 rounded-lg border border-border2"
            style={{ backgroundColor: (data as { color: string }).color }}
          />
          <div>
            <p className="mono text-sm text-fg2">
              {(data as { color: string }).color}
            </p>
            <p className="text-xs text-muted-fg">
              {(data as { reason: string }).reason}
            </p>
          </div>
        </div>
      )}

      {data && type === "recommend" && (
        <ul className="mt-3 space-y-2">
          {(data as Array<{ question: string }>).map((q, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-fg2">
              <IconBox size="sm">◎</IconBox> {q.question}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
