"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Chip, Field, Input, Textarea } from "@/components/ui";
import { CopyText } from "@/components/copy-text";
import { buildApplicationEmail, type Applicant, type EmailJobInput } from "@/lib/job-email";

/**
 * 邮件投递助手。
 *
 * 定位：**不需要你把邮箱授权码交出来**。这里生成好主题与正文（可改），
 * 你点「打开邮箱写新邮件」在自己邮箱里粘贴发送，回来点「标记为已投递」。
 * 等以后配上 SMTP，这套草稿可以直接交给服务端发送，界面不用变。
 */
export function EmailDraft({
  jobId,
  job,
  applicant,
  hasApplication,
}: {
  jobId: string;
  job: EmailJobInput;
  applicant: Applicant;
  hasApplication: boolean;
}) {
  const router = useRouter();
  const draft = useMemo(() => buildApplicationEmail(job, applicant), [job, applicant]);
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function markSent() {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          channel: "email",
          status: "sent",
          note: "邮件投递（用邮件助手发出）",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "记录失败");
      setMsg("已记为「已投递」，可以在下面的跟进面板里更新进度");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "记录失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone="success">收件人：{draft.to}</Chip>
        <CopyText text={draft.to} label="复制邮箱" />
        {applicant.email ? (
          <span className="text-[11.5px] text-muted-fg">你的回信邮箱：{applicant.email}</span>
        ) : (
          <span className="text-[11.5px] text-muted-fg">
            简历里没读到你的邮箱 —— 建议在简历工坊补上，HR 回信才不会丢
          </span>
        )}
      </div>

      <Field label="邮件主题（可改）">
        <div className="flex flex-wrap items-center gap-2">
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="min-w-0 flex-1" />
          <CopyText text={subject} label="复制主题" />
        </div>
      </Field>

      <Field label="邮件正文（可改）">
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={16} />
      </Field>

      <div className="flex flex-wrap items-center gap-2">
        <a
          href={`mailto:${draft.to}?subject=${encodeURIComponent(subject)}`}
          className="btn btn-sm btn-primary"
        >
          打开邮箱写新邮件 ↗
        </a>
        <CopyText text={body} label="复制正文" variant="secondary" />
        <CopyText text={`${subject}\n\n${body}`} label="复制主题+正文" variant="secondary" />
        <Button onClick={markSent} disabled={busy}>
          {busy ? "记录中…" : "标记为已投递"}
        </Button>
        {hasApplication ? <span className="text-[11.5px] text-muted-fg">已有投递记录（重复点击只会更新状态）</span> : null}
      </div>

      <ul className="space-y-1 text-[12px] leading-relaxed text-muted-fg">
        {draft.tips.map((t) => (
          <li key={t}>· {t}</li>
        ))}
      </ul>

      {msg ? <p className="text-xs text-primary">{msg}</p> : null}
      {err ? <p className="text-xs text-destructive-fg">{err}</p> : null}
    </div>
  );
}
