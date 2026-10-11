"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Chip, Field, Input, Select, Textarea } from "@/components/ui";
import {
  APP_STATUSES,
  CHANNELS,
  CHANNEL_LABEL,
  STATUS_LABEL,
  parseTimeline,
  type AppStatus,
  type Channel,
} from "@/lib/application-status";

type AppRecord = {
  id: string;
  status: string;
  channel: string;
  note: string | null;
  nextFollowUp: string | null;
  appliedAt: string | null;
  timeline: string;
};

/**
 * 职位详情页的「记录投递」面板。
 *
 * 定位：**平台上的提交由你自己点**，这里只负责记录状态、提醒跟进、留时间线。
 * 这样既不碰你的平台账号，也不会因为自动化投递把号搭进去。
 */
export function ApplicationPanel({
  jobId,
  defaultChannel,
  initial,
}: {
  jobId: string;
  /** 默认渠道：邮件岗位给 email，平台岗位给对应平台 */
  defaultChannel: Channel;
  initial: AppRecord | null;
}) {
  const router = useRouter();
  const [app, setApp] = useState<AppRecord | null>(initial);
  const [channel, setChannel] = useState<string>(initial?.channel ?? defaultChannel);
  const [note, setNote] = useState(initial?.note ?? "");
  const [next, setNext] = useState(initial?.nextFollowUp ? initial.nextFollowUp.slice(0, 10) : "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function call(method: "POST" | "PATCH" | "DELETE", body?: unknown) {
    setBusy(true);
    setErr(null);
    setSaved(false);
    try {
      const url = app ? `/api/applications/${app.id}` : "/api/applications";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "操作失败");
      if (method === "DELETE") {
        setApp(null);
        setNote("");
        setNext("");
      } else {
        setApp(json.application as AppRecord);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "操作失败");
    } finally {
      setBusy(false);
    }
  }

  const timeline = app ? parseTimeline(app.timeline) : [];
  const status = (app?.status ?? "draft") as AppStatus;

  return (
    <div className="space-y-4">
      {!app ? (
        <div className="space-y-3">
          <p className="text-[13px] leading-relaxed text-fg2">
            投了这个岗位就在这里记一笔，之后可以更新状态和跟进时间。
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="投递渠道">
              <Select value={channel} onChange={(e) => setChannel(e.target.value)}>
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {CHANNEL_LABEL[c]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="下次跟进（可选）">
              <Input type="date" value={next} onChange={(e) => setNext(e.target.value)} />
            </Field>
            <div className="flex items-end">
              <Button
                onClick={() =>
                  call("POST", {
                    jobId,
                    channel,
                    status: "sent",
                    note: note || null,
                    nextFollowUp: next || null,
                  })
                }
                disabled={busy}
              >
                {busy ? "记录中…" : "标记为已投递"}
              </Button>
            </div>
          </div>
          <Field label="备注（可选）">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="比如：用简历 v3 投的、对方 HR 姓王…" />
          </Field>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12.5px] text-muted-fg">当前状态</span>
            {APP_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                disabled={busy}
                onClick={() => s !== status && call("PATCH", { status: s })}
                className={`tab ${s === status ? "tab-active" : ""}`}
                aria-pressed={s === status}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="投递渠道">
              <Select value={channel} onChange={(e) => setChannel(e.target.value)}>
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {CHANNEL_LABEL[c]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="下次跟进">
              <Input type="date" value={next} onChange={(e) => setNext(e.target.value)} />
            </Field>
            <div className="flex items-end gap-2">
              <Button
                variant="secondary"
                onClick={() => call("PATCH", { note, nextFollowUp: next || null, channel })}
                disabled={busy}
              >
                保存
              </Button>
              <Button variant="ghost" onClick={() => call("DELETE")} disabled={busy}>
                删除记录
              </Button>
            </div>
          </div>

          <Field label="备注">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </Field>

          {app.appliedAt ? (
            <p className="text-[12px] text-muted-fg">
              首次投递：{new Date(app.appliedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}
            </p>
          ) : null}

          {timeline.length > 0 ? (
            <div>
              <p className="text-[12px] font-semibold text-muted-fg">时间线</p>
              <ul className="mt-1.5 space-y-1 text-[12.5px] text-fg2">
                {[...timeline].reverse().map((t, i) => (
                  <li key={`${t.at}-${i}`}>
                    {new Date(t.at).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    {" · "}
                    {t.from ? `${STATUS_LABEL[t.from as AppStatus] ?? t.from} → ` : ""}
                    {t.to ? STATUS_LABEL[t.to as AppStatus] ?? t.to : "更新"}
                    {t.note ? `（${t.note}）` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      {saved ? <Chip tone="success">已保存</Chip> : null}
      {err ? <p className="text-xs text-destructive-fg">{err}</p> : null}
    </div>
  );
}
