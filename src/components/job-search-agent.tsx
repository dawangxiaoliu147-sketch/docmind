"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert, Button, Chip, Field, Input, Panel, Select, Textarea } from "@/components/ui";
import { CopyText } from "@/components/copy-text";

/**
 * 找岗位 Agent 的界面。
 *
 * 流程：选简历 + 填目标 → AI 生成搜索词 → 给出各平台的搜索链接（点开自己看）
 * 另外附上公开源里已经搜到的具体帖子，可直接点开或记一笔投递。
 *
 * 这里只生成链接、不代你登录任何平台，所以界面上没有任何"自动投递"的入口。
 */

type ResumeOption = { id: string; title: string; updatedAt: string };

type PlanView = {
  profile: { titles: string[]; skills: string[]; years: string | null; summary: string | null };
  queries: { label: string; keyword: string; why: string }[];
  notes: string[];
  aiUsed: boolean;
  warning?: string;
};

type LinkView = { id: string; name: string; url: string; fallbackUrl: string; note?: string };
type QueryView = { query: { label: string; keyword: string; why: string }; links: LinkView[] };

type PostView = {
  title: string;
  company: string;
  location: string;
  salary: string;
  url: string | null;
  postedAt: string | null;
  applyChannel: string;
  applyEmail: string | null;
};

type AgentResponse = {
  plan: PlanView;
  queries: QueryView[];
  foundPosts: PostView[];
  webSearch: {
    configured: boolean;
    provider: string | null;
    error: string | null;
    hits: WebHitView[];
  };
  resumeTitle: string | null;
  publicSource: { ok: boolean; error?: string };
};

type WebHitView = {
  title: string;
  url: string;
  snippet: string;
  kind?: "job" | "list" | "company" | "other";
  platform: string | null;
  fromQuery: string;
};

function daysAgo(iso: string | null): string {
  if (!iso) return "";
  const days = Math.floor((Date.now() - Date.parse(iso)) / 86400000);
  if (days <= 0) return "今天";
  if (days === 1) return "昨天";
  if (days < 30) return `${days} 天前`;
  return `${Math.floor(days / 30)} 个月前`;
}

export function JobSearchAgent({ resumes }: { resumes: ResumeOption[] }) {
  const [resumeId, setResumeId] = useState(resumes[0]?.id ?? "");
  const [pasted, setPasted] = useState("");
  const [city, setCity] = useState("");
  const [remote, setRemote] = useState(false);
  const [years, setYears] = useState("");
  const [salary, setSalary] = useState("");
  const [extra, setExtra] = useState("");
  const [exclude, setExclude] = useState("");

  const [data, setData] = useState<AgentResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [recording, setRecording] = useState<string | null>(null);
  const [recorded, setRecorded] = useState<string[]>([]);

  async function run() {
    if (!pasted.trim() && !resumeId) {
      setErr("先选一份简历，或把简历内容粘进来。");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/jobs/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: pasted.trim() ? undefined : resumeId,
          text: pasted.trim() || undefined,
          prefs: { city, remote, years, salary, extra, exclude },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "生成失败");
      setData(json as AgentResponse);
      setRecorded([]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "生成失败");
    } finally {
      setBusy(false);
    }
  }

  async function record(p: PostView) {
    const key = p.url ?? p.title;
    setRecording(key);
    setErr(null);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: p.title,
          company: p.company,
          url: p.url,
          channel: p.applyEmail ? "email" : "other",
          status: "sent",
          note: "从找岗位结果里记的",
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "记录失败");
      }
      setRecorded((prev) => [...prev, key]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "记录失败");
    } finally {
      setRecording(null);
    }
  }

  const allKeywords = data ? data.queries.map((q) => q.query.keyword).join("\n") : "";

  return (
    <div className="space-y-5">
      <div data-tour="job-agent-form" className="grid gap-4 sm:grid-cols-2">
        <Field label="用哪份简历" hint={resumes.length === 0 ? "还没有简历，去简历工坊建一份" : "AI 只读这份简历里的内容"}>
          {resumes.length > 0 ? (
            <Select value={resumeId} onChange={(e) => setResumeId(e.target.value)} disabled={pasted.trim().length > 0}>
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </Select>
          ) : (
            <Link href="/resume" className="btn btn-sm btn-secondary">
              去建简历
            </Link>
          )}
        </Field>

        <Field label="城市" hint="留空就不限；填了会多给一组带城市的搜索词">
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="北京 / 上海 / 深圳…" />
        </Field>
      </div>

      <details className="rounded-lg border border-border bg-surface px-4 py-3">
        <summary className="cursor-pointer select-none text-[13px] text-fg2">
          或者：直接粘一份简历文本（会盖过上面的选择）
        </summary>
        <div className="mt-3">
          <Textarea
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            rows={6}
            placeholder="把简历内容粘进来…"
          />
        </div>
      </details>

      <div className="grid gap-4 sm:grid-cols-4">
        <Field label="经验年限">
          <Input value={years} onChange={(e) => setYears(e.target.value)} placeholder="如 5" />
        </Field>
        <Field label="期望薪资">
          <Input value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="如 30-50K" />
        </Field>
        <Field label="补充说明">
          <Input value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="如 只看 AI 方向" />
        </Field>
        <Field label="不要什么">
          <Input value={exclude} onChange={(e) => setExclude(e.target.value)} placeholder="如 外包 / 销售" />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setRemote((v) => !v)}
          aria-pressed={remote}
          className="tab"
        >
          {remote ? "✓ 接受远程" : "接受远程"}
        </button>
        <Button onClick={run} disabled={busy}>
          {busy ? "正在读简历、生成搜索词…" : "生成搜索方案"}
        </Button>
        <span className="text-[12px] text-muted-fg">
          只生成链接，不代你登录平台；打开后是你自己的账号在搜。
        </span>
      </div>

      {err ? <p className="text-xs text-destructive-fg">{err}</p> : null}

      {data ? (
        <div className="space-y-5">
          <Panel className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[13px] font-semibold text-fg">AI 读到的你</p>
              <Chip tone={data.plan.aiUsed ? "success" : "outline"}>
                {data.plan.aiUsed ? "AI 生成" : "规则生成"}
              </Chip>
              {data.resumeTitle ? (
                <span className="text-[11.5px] text-muted-fg">简历：{data.resumeTitle}</span>
              ) : null}
            </div>

            {data.plan.warning ? (
              <p className="mt-2 text-[12px] text-muted-fg">{data.plan.warning}</p>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-1.5">
              {data.plan.profile.titles.map((t) => (
                <Chip key={t} tone="primary">
                  {t}
                </Chip>
              ))}
              {data.plan.profile.years ? <Chip tone="outline">{data.plan.profile.years} 年经验</Chip> : null}
              {data.plan.profile.skills.slice(0, 10).map((s) => (
                <Chip key={s}>{s}</Chip>
              ))}
            </div>

            {data.plan.profile.summary ? (
              <p className="mt-3 text-[12.5px] leading-relaxed text-fg2">{data.plan.profile.summary}</p>
            ) : null}
          </Panel>

          <Panel className="p-5" data-tour="job-agent-plan">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13px] font-semibold text-fg">搜索方案</p>
              <CopyText text={allKeywords} label="复制全部搜索词" />
            </div>

            <div className="mt-4 space-y-4">
              {data.queries.map((q) => (
                <div key={q.query.keyword} className="border-t border-border pt-3 first:border-0 first:pt-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip tone="outline">{q.query.label}</Chip>
                    <code className="mono rounded-md bg-muted px-2.5 py-1 text-[13px] text-fg">
                      {q.query.keyword}
                    </code>
                    <CopyText text={q.query.keyword} label="复制" />
                    {q.query.why ? (
                      <span className="text-[11.5px] text-muted-fg">{q.query.why}</span>
                    ) : null}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {q.links.map((l) => (
                      <a
                        key={l.id}
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-secondary"
                        title={l.note}
                      >
                        {l.name} ↗
                      </a>
                    ))}
                  </div>

                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-fg">
                    打不开的话改用搜索引擎：
                    {q.links.map((l, i) => (
                      <span key={l.id}>
                        {i > 0 ? " · " : ""}
                        <a
                          href={l.fallbackUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {l.name}
                        </a>
                      </span>
                    ))}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13px] font-semibold text-fg">搜到的具体岗位</p>
              {data.webSearch.configured && data.webSearch.provider ? (
                <span className="text-[11.5px] text-muted-fg">
                  来自 {data.webSearch.provider} 的站内结果
                </span>
              ) : null}
            </div>

            {!data.webSearch.configured ? (
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted-fg">
                没配搜索引擎，所以这里只有平台搜索页的链接。想直接拿到具体岗位的链接，
                在服务器 .env 里配一家即可：<span className="mono">SEARCH_PROVIDER</span> 加
                Brave / Tavily / Google CSE 任一的 key。
              </p>
            ) : data.webSearch.hits.length === 0 ? (
              <p className="mt-2 text-[12.5px] text-muted-fg">
                这次没搜到具体岗位链接
                {data.webSearch.error ? `（${data.webSearch.error}）` : ""}，用上面的搜索链接自己看看。
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {data.webSearch.hits.map((h) => (
                  <li key={h.url} className="rounded-lg border border-border px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13.5px] font-semibold text-fg">{h.title}</span>
                      {h.platform ? <Chip tone="outline">{h.platform}</Chip> : null}
                      {h.kind && h.kind !== "job" ? (
                        <Chip tone="muted">
                          {h.kind === "list" ? "列表页" : h.kind === "company" ? "公司页" : "非岗位页"}
                        </Chip>
                      ) : null}
                      <span className="text-[11.5px] text-muted-fg">搜「{h.fromQuery}」时找到</span>
                    </div>
                    {h.snippet ? (
                      <p className="mt-1 text-[12.5px] leading-relaxed text-muted-fg">{h.snippet}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <a
                        href={h.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-secondary"
                      >
                        打开岗位 ↗
                      </a>
                      <CopyText text={h.url} label="复制链接" />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel className="p-5" data-tour="job-agent-posts">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13px] font-semibold text-fg">已经搜到的岗位</p>
              <span className="text-[11.5px] text-muted-fg">来自公开源（V2EX 招聘），点开核对</span>
            </div>

            {!data.publicSource.ok ? (
              <p className="mt-2 text-[12px] text-muted-fg">
                公开源这次没连上，上面的平台链接照常可用。
              </p>
            ) : null}

            {data.foundPosts.length === 0 ? (
              <p className="mt-3 text-[12.5px] text-muted-fg">
                公开源里这次没有对得上的帖子。用上面的链接去平台上搜。
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {data.foundPosts.map((p) => {
                  const key = p.url ?? p.title;
                  const done = recorded.includes(key);
                  return (
                    <li key={key} className="rounded-lg border border-border px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13.5px] font-semibold text-fg">{p.title}</span>
                        {p.applyEmail ? <Chip tone="success">可邮件投递</Chip> : null}
                        {p.postedAt ? (
                          <span className="text-[11.5px] text-muted-fg">{daysAgo(p.postedAt)}</span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-[12.5px] text-muted-fg">
                        {p.company}
                        {p.location ? ` · ${p.location}` : ""}
                        {p.salary ? ` · ${p.salary}` : ""}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {p.url ? (
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-secondary"
                          >
                            打开原帖 ↗
                          </a>
                        ) : null}
                        {p.applyEmail ? <CopyText text={p.applyEmail} label="复制邮箱" /> : null}
                        <Button
                          size="sm"
                          variant={done ? "ghost" : "primary"}
                          disabled={done || recording === key}
                          onClick={() => record(p)}
                        >
                          {done ? "已记录投递" : recording === key ? "记录中…" : "记一笔投递"}
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          {data.plan.notes.length > 0 ? (
            <Alert tone="default" icon="i">
              <ul className="space-y-1 text-[12.5px] leading-relaxed text-fg2">
                {data.plan.notes.map((n) => (
                  <li key={n}>· {n}</li>
                ))}
              </ul>
            </Alert>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
