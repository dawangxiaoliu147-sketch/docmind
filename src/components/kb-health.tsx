"use client";

import { useState } from "react";
import { Alert, Button, Card, Chip, Progress, Skeleton, cn } from "@/components/ui";
import type { ChipTone } from "@/components/ui";
import { SCORE_RULES, type HealthFinding, type HealthReport } from "@/lib/kb-health";

const GRADE_TONE: Record<string, ChipTone> = {
  优秀: "success",
  良好: "primary",
  需改进: "outline",
  较差: "red",
  空库: "muted",
};

/** 体检发现 → 提示条配色与图标。critical 用红色，info 用信息色，其余走默认中性。 */
const FINDING_STYLE: Record<HealthFinding["level"], { tone: "default" | "error" | "info"; icon: string }> = {
  critical: { tone: "error", icon: "✕" },
  warn: { tone: "default", icon: "!" },
  info: { tone: "info", icon: "i" },
};

/**
 * 知识库体检：点一下扫一遍，给出分数、逐项指标、问题和建议。
 *
 * 按需触发而不是进页面就算：重复片段那一步要在数据库里对全库片段做分组，
 * 不该让每次打开知识库页都背上这个开销（和 AI 摘要/图谱同一套做法）。
 */
export function KbHealth({ kbId }: { kbId: string }) {
  const [report, setReport] = useState<HealthReport | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function scan() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/kb/${kbId}/health`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "体检失败");
      } else {
        setReport(json.report as HealthReport);
      }
    } catch {
      setError("体检失败，请重试");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={scan} disabled={pending} variant="secondary">
          {pending ? "扫描中…" : report ? "↻ 重新体检" : "⊕ 开始体检"}
        </Button>
        {report && <Chip tone={GRADE_TONE[report.grade] ?? "muted"}>{report.grade}</Chip>}
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-muted-fg">
        只读扫描本库的文档与知识片段，不调用 AI、不消耗配额。
      </p>

      {pending && !report && (
        <div className="mt-4">
          <Skeleton className="w-1/3" />
          <Skeleton className="mt-2 w-full" />
          <Skeleton className="mt-2 w-2/3" />
        </div>
      )}

      {error && <p className="mt-3 text-xs text-destructive-fg">{error}</p>}

      {report && (
        <div className="mt-4 flex flex-col gap-4">
          <Card pad>
            <div className="flex items-baseline gap-2">
              <span className="num text-3xl font-semibold text-fg">{report.score}</span>
              <span className="text-sm text-muted-fg">/ 100 · {report.grade}</span>
            </div>
            <div className="mt-3">
              <Progress value={report.score} label="健康度" />
            </div>
          </Card>

          <div className="grid gap-2 sm:grid-cols-2">
            {report.checks.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2"
              >
                <span className="min-w-0 truncate text-[12.5px] text-fg2">{c.label}</span>
                <span
                  className={cn(
                    "num shrink-0 text-[13px] font-semibold",
                    c.ok ? "text-fg" : "text-destructive-fg",
                  )}
                >
                  {c.value}
                </span>
              </div>
            ))}
          </div>

          {report.findings.length === 0 ? (
            <Alert tone="info" icon="✓">
              <p className="text-[13.5px] font-semibold text-fg">没有发现问题</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-fg2">
                该库的文档与片段都处于可用状态。
              </p>
            </Alert>
          ) : (
            report.findings.map((f) => {
              const style = FINDING_STYLE[f.level];
              return (
                <Alert key={f.id} tone={style.tone} icon={style.icon}>
                  <p className="text-[13.5px] font-semibold text-fg">{f.title}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-fg2">{f.detail}</p>
                  {f.docTitles.length > 0 && (
                    <p className="mt-1.5 text-[12px] leading-relaxed text-muted-fg">
                      {f.docTitles.join("、")}
                      {f.moreDocs > 0 ? ` 等 ${f.moreDocs + f.docTitles.length} 份` : ""}
                    </p>
                  )}
                </Alert>
              );
            })
          )}

          <div>
            <p className="mb-1.5 text-[12px] font-semibold text-muted-fg">建议</p>
            <ul className="ml-4 list-disc space-y-1 text-[13px] leading-relaxed text-fg2">
              {report.suggestions.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>

          <details className="text-[12px] leading-relaxed text-muted-fg">
            <summary className="cursor-pointer select-none">评分规则与扫描范围</summary>
            <ul className="ml-4 mt-2 list-disc space-y-0.5">
              {SCORE_RULES.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
            <p className="mt-2">
              扫描时间：{new Date(report.scannedAt).toLocaleString("zh-CN")}
            </p>
            <p className="mt-1">
              重复片段按「去掉多余空白后的正文」比对，同一段文字换行或缩进不同也能认出来。
              <br />
              本报告**不含「覆盖率」**（哪些文档从未被提问命中）：检索命中目前没有落库，
              算不出来 —— 与其编一个近似值，不如先空着。
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
