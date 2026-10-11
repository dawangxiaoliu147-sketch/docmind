"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Chip, Skeleton } from "@/components/ui";
import { jobSourceLabel } from "@/lib/job-labels";

type SourceInfo = {
  id: string;
  name: string;
  homepage: string;
  kind: string;
  note: string;
  enabledByDefault: boolean;
};

type SourceStat = {
  source: string;
  total: number;
  active: number;
  email: number;
  lastFetchedAt: string | null;
};

type SyncResult = {
  source: string;
  name: string;
  ok: boolean;
  fetched: number;
  created: number;
  updated: number;
  withEmail: number;
  ms: number;
  error?: string;
};

function when(iso: string | null): string {
  if (!iso) return "还没同步过";
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  const hm = d.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  return days <= 0 ? `今天 ${hm.slice(-5)}` : `${hm}`;
}

/**
 * 职位同步面板。
 * 只做一件事：把**公开可访问**的真实职位抓进来（V2EX 招聘 feed + 你自配的 RSS）。
 * 界面上把每个源的来源与限制写清楚，并说明为什么没有 BOSS/智联这类渠道 —— 那是合规问题，不是技术问题。
 */
export function JobSyncPanel() {
  const router = useRouter();
  const [sources, setSources] = useState<SourceInfo[]>([]);
  const [stats, setStats] = useState<SourceStat[]>([]);
  const [results, setResults] = useState<SyncResult[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/jobs/sync");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "读取失败");
      setSources(json.sources ?? []);
      setStats(json.stats ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "读取失败");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- 挂载时从后端拉一次源清单与统计，
       属于"与外部系统同步"的标准用法；状态更新都在 await 之后，不是同步级联渲染。 */
    void load();
  }, [load]);

  async function run(ids?: string[]) {
    setBusy(ids && ids.length === 1 ? ids[0] : "all");
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/jobs/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ids ? { sources: ids } : {}),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "同步失败");
      setResults(json.results ?? []);
      setStats(json.stats ?? []);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "同步失败");
    } finally {
      setBusy(null);
    }
  }

  async function clearDemo() {
    setBusy("demo");
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/jobs/demo", { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "清除失败");
      setNotice(`已清除 ${json.deleted} 条内置示例职位`);
      await load();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "清除失败");
    } finally {
      setBusy(null);
    }
  }

  const real = stats.filter((s) => s.source !== "demo");
  const totalReal = real.reduce((n, s) => n + s.total, 0);
  const totalEmail = real.reduce((n, s) => n + s.email, 0);
  const demo = stats.find((s) => s.source === "demo");
  const statOf = (id: string) => stats.find((s) => s.source === id);
  // 不是注册源的那些 = 用户自己抓取/导入的（平台岗位、CSV、手动添加）
  const imported = real.filter((s) => !sources.some((x) => x.id === s.source));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => run()} disabled={busy !== null}>
          {busy === "all" ? "同步中…" : "同步真实职位"}
        </Button>
        <span className="text-[13px] text-fg2">
          真实职位 <strong className="num text-fg">{totalReal}</strong> 条，其中
          <strong className="num text-fg"> {totalEmail} </strong>条可直接邮件投递
        </span>
      </div>

      {error ? <p className="text-xs text-destructive-fg">{error}</p> : null}
      {notice ? <p className="text-xs text-primary">{notice}</p> : null}

      {demo && demo.total > 0 ? (
        <Alert tone="default" icon="!">
          <p className="text-[13px] font-semibold text-fg">
            库里还有 {demo.total} 条示例职位，不是真实招聘
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-fg2">
            它们默认不显示，但会计入职位数。清掉后数据就都是真实的。
          </p>
          <div className="mt-2">
            <Button variant="outline" size="sm" onClick={clearDemo} disabled={busy !== null}>
              {busy === "demo" ? "清除中…" : "清除示例职位"}
            </Button>
          </div>
        </Alert>
      ) : null}

      {!loaded ? (
        <div className="space-y-2">
          <Skeleton className="w-1/3" />
          <Skeleton className="w-full" />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sources.map((s) => {
            const st = statOf(s.id);
            return (
              <div key={s.id} className="rounded-lg border border-border bg-surface px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13.5px] font-semibold text-fg">{s.name}</span>
                  <Chip tone={s.enabledByDefault ? "primary" : "outline"}>
                    {s.enabledByDefault ? "默认启用" : "需要自己配置"}
                  </Chip>
                  {st ? <Chip tone="muted">{st.total} 条 · 可邮件 {st.email}</Chip> : null}
                  <span className="text-[11.5px] text-muted-fg">上次同步：{when(st?.lastFetchedAt ?? null)}</span>
                  <span className="ml-auto flex items-center gap-2">
                    {s.homepage ? (
                      <a
                        href={s.homepage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12px] text-primary hover:underline"
                      >
                        源站 ↗
                      </a>
                    ) : null}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => run([s.id])}
                      disabled={busy !== null}
                    >
                      {busy === s.id ? "同步中…" : "同步这个源"}
                    </Button>
                  </span>
                </div>
                <p className="mt-1.5 text-[12px] leading-relaxed text-muted-fg">{s.note}</p>
              </div>
            );
          })}
        </div>
      )}

      {imported.length > 0 ? (
        <div className="rounded-lg border border-border bg-surface px-4 py-3">
          <p className="text-[13px] font-semibold text-fg">你抓取 / 导入的岗位</p>
          <p className="mt-1 text-[12px] leading-relaxed text-muted-fg">
            {imported.map((s) => `${jobSourceLabel(s.source)} ${s.total} 条（可邮件投递 ${s.email}）`).join(" · ")}
          </p>
        </div>
      ) : null}

      {results && results.length > 0 ? (
        <div className="rounded-lg border border-border bg-surface px-4 py-3">
          <p className="text-[12px] font-semibold text-muted-fg">本次同步结果</p>
          <ul className="mt-1.5 space-y-1 text-[12.5px] text-fg2">
            {results.map((r) => (
              <li key={r.source}>
                {r.ok ? "✓" : "✗"} {r.name}：抓取 {r.fetched} 条，新增 {r.created}，更新 {r.updated}，
                其中可邮件投递 {r.withEmail} 条，用时 {r.ms}ms
                {r.error ? <span className="text-destructive-fg">　错误：{r.error}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-[12px] leading-relaxed text-muted-fg">
        招聘平台（BOSS直聘、智联、猎聘等）没有公开接口，这里不抓取。
        平台上的岗位请用「抓取岗位」手动存进来。
      </p>
    </div>
  );
}
