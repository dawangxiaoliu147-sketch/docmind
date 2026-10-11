"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Job } from "@prisma/client";
import { Chip } from "@/components/ui";

/** 来源 → 展示名。真实来源都标出来，别让用户分不清哪条是抓来的、哪条是手填的 */
const SOURCE_LABEL: Record<string, string> = {
  v2ex: "V2EX",
  eleduck: "电鸭",
  rss: "RSS",
  csv: "导入",
  manual: "手动添加",
  demo: "内置示例",
};

const CHANNEL: Record<string, { label: string; tone: "success" | "primary" | "muted" }> = {
  email: { label: "可邮件投递", tone: "success" },
  link: { label: "有投递链接", tone: "primary" },
  wechat: { label: "微信联系", tone: "muted" },
  unknown: { label: "未注明投递方式", tone: "muted" },
};

/** 相对时间：真实职位"多久以前发的"比绝对日期更有用 */
function ago(d: Date | string | null): string {
  if (!d) return "";
  const t = typeof d === "string" ? Date.parse(d) : d.getTime();
  if (Number.isNaN(t)) return "";
  const days = Math.floor((Date.now() - t) / 86400000);
  if (days <= 0) return "今天";
  if (days === 1) return "昨天";
  if (days < 30) return `${days} 天前`;
  return `${Math.floor(days / 30)} 个月前`;
}

export function JobsBrowser({ jobs }: { jobs: Job[] }) {
  const [q, setQ] = useState("");
  const [onlyEmail, setOnlyEmail] = useState(false);

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return jobs.filter((j) => {
      if (onlyEmail && j.applyChannel !== "email") return false;
      if (!kw) return true;
      return (
        j.title.toLowerCase().includes(kw) ||
        j.company.toLowerCase().includes(kw) ||
        j.location.toLowerCase().includes(kw) ||
        j.tags.some((t) => t.toLowerCase().includes(kw))
      );
    });
  }, [jobs, q, onlyEmail]);

  const emailCount = jobs.filter((j) => j.applyChannel === "email").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索职位 / 公司 / 技能 / 城市…"
          className="ui-field max-w-md"
          data-tour="jobs-search"
        />
        <button
          type="button"
          onClick={() => setOnlyEmail((v) => !v)}
          aria-pressed={onlyEmail}
          className="tab"
          title="只显示帖子里直接给了邮箱的职位 —— 这类可以直接投递"
        >
          只看可邮件投递{emailCount > 0 ? `（${emailCount}）` : ""}
        </button>
        <span className="text-[12.5px] text-muted-fg">
          共 {filtered.length} 条 / {jobs.length} 条
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-fg">
          {jobs.length === 0
            ? "还没有真实职位 —— 去上面「职位同步」抓一批，或点右上角手动添加"
            : "没有匹配的职位"}
        </p>
      ) : (
        <div className="card-grid">
          {filtered.map((j) => {
            const ch = CHANNEL[j.applyChannel ?? "unknown"] ?? CHANNEL.unknown;
            return (
              <Link key={j.id} href={`/jobs/${j.id}`} className="group card card-hover card-pad">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="min-w-0 font-semibold text-fg group-hover:text-primary">{j.title}</h3>
                  {j.salary ? (
                    <span className="chip chip-primary shrink-0">{j.salary}</span>
                  ) : null}
                </div>

                <p className="mt-1 text-sm text-muted-fg">
                  {j.company}
                  {j.location ? ` · ${j.location}` : ""}
                </p>

                {j.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {j.tags.map((t) => (
                      <span key={t} className="chip">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                  <Chip tone="outline">{SOURCE_LABEL[j.source] ?? j.source}</Chip>
                  <Chip tone={ch.tone}>{ch.label}</Chip>
                  {j.postedAt ? (
                    <span className="text-[11.5px] text-muted-fg">{ago(j.postedAt)}</span>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
