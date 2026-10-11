"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Chip } from "@/components/ui";
import {
  APP_STATUSES,
  CHANNEL_LABEL,
  STATUS_LABEL,
  STATUS_ORDER,
  type AppStatus,
} from "@/lib/application-status";

export type BoardItem = {
  id: string;
  status: string;
  channel: string;
  note: string | null;
  nextFollowUp: string | null;
  appliedAt: string | null;
  job: { id: string; title: string; company: string; location: string; salary: string; source: string };
};

function day(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai", month: "2-digit", day: "2-digit" });
}

/**
 * 投递看板：漏斗视图 + 待跟进。
 * 状态改动是**即时生效**的（乐观更新本地 state，失败回滚并提示）。
 */
export function ApplicationsBoard({ items, dueIds }: { items: BoardItem[]; dueIds: string[] }) {
  const router = useRouter();
  const [list, setList] = useState(items);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const due = list.filter((i) => dueIds.includes(i.id));
  const byStatus = new Map<string, BoardItem[]>();
  for (const s of STATUS_ORDER) byStatus.set(s, []);
  for (const it of list) byStatus.get(it.status)?.push(it);

  const interviewed = list.filter((i) => i.status === "interview" || i.status === "offer").length;

  async function patch(id: string, body: Record<string, unknown>) {
    setBusy(id);
    setErr(null);
    const before = list;
    setList((prev) => prev.map((i) => (i.id === id ? { ...i, ...(body as Partial<BoardItem>) } : i)));
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "更新失败");
      }
      router.refresh();
    } catch (e) {
      setList(before); // 回滚，别让界面骗人
      setErr(e instanceof Error ? e.message : "更新失败");
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    setBusy(id);
    setErr(null);
    const before = list;
    setList((prev) => prev.filter((i) => i.id !== id));
    try {
      const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("删除失败");
      router.refresh();
    } catch (e) {
      setList(before);
      setErr(e instanceof Error ? e.message : "删除失败");
    } finally {
      setBusy(null);
    }
  }

  /** 顺延 N 天 */
  function snooze(id: string, days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    void patch(id, { nextFollowUp: d.toISOString() });
  }

  if (list.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-fg">
        还没有投递记录。去 <Link href="/jobs" className="text-primary hover:underline">职位库</Link> 选一个岗位，
        在详情页点「记录投递」即可开始跟进。
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 text-[13px] text-fg2">
        <Chip tone="primary">共 {list.length} 条</Chip>
        <Chip tone="outline">面试/录用 {interviewed}</Chip>
        <Chip tone={due.length > 0 ? "red" : "muted"}>待跟进 {due.length}</Chip>
      </div>

      {err ? <p className="text-xs text-destructive-fg">{err}</p> : null}

      {due.length > 0 ? (
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-[13px] font-semibold text-fg">该跟进了</p>
          <ul className="mt-2 space-y-2">
            {due.map((it) => (
              <li key={it.id} className="flex flex-wrap items-center gap-2 text-[13px]">
                <Link href={`/jobs/${it.job.id}`} className="font-medium text-fg hover:text-primary">
                  {it.job.title}
                </Link>
                <span className="text-muted-fg">{it.job.company}</span>
                <span className="text-muted-fg">· 计划 {day(it.nextFollowUp)}</span>
                <span className="ml-auto flex gap-2">
                  <Button size="sm" variant="secondary" disabled={busy === it.id} onClick={() => patch(it.id, { nextFollowUp: null })}>
                    已跟进
                  </Button>
                  <Button size="sm" variant="ghost" disabled={busy === it.id} onClick={() => snooze(it.id, 3)}>
                    顺延 3 天
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {STATUS_ORDER.filter((s) => (byStatus.get(s) ?? []).length > 0).map((s) => (
        <div key={s}>
          <p className="mb-2 text-[12.5px] font-semibold text-muted-fg">
            {STATUS_LABEL[s]} · {(byStatus.get(s) ?? []).length}
          </p>
          <div className="flex flex-col gap-2">
            {(byStatus.get(s) ?? []).map((it) => (
              <div key={it.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
                <Link href={`/jobs/${it.job.id}`} className="min-w-0 font-medium text-fg hover:text-primary">
                  {it.job.title}
                </Link>
                <span className="text-[12.5px] text-muted-fg">
                  {it.job.company}
                  {it.job.location ? ` · ${it.job.location}` : ""}
                </span>
                <Chip tone="outline">{CHANNEL_LABEL[it.channel] ?? it.channel}</Chip>
                {it.appliedAt ? <span className="text-[11.5px] text-muted-fg">投于 {day(it.appliedAt)}</span> : null}
                {it.nextFollowUp ? (
                  <span className="text-[11.5px] text-muted-fg">跟进 {day(it.nextFollowUp)}</span>
                ) : null}

                <span className="ml-auto flex items-center gap-2">
                  <select
                    value={it.status}
                    disabled={busy === it.id}
                    onChange={(e) => patch(it.id, { status: e.target.value })}
                    className="ui-field max-w-[9.5rem] text-[12.5px]"
                    aria-label="改状态"
                  >
                    {APP_STATUSES.map((x) => (
                      <option key={x} value={x}>
                        {STATUS_LABEL[x as AppStatus]}
                      </option>
                    ))}
                  </select>
                  <Button size="sm" variant="ghost" disabled={busy === it.id} onClick={() => remove(it.id)}>
                    删除
                  </Button>
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
