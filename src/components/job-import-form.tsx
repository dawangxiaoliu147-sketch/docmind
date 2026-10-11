"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Chip, Field, Input, Textarea } from "@/components/ui";
import { CopyText } from "@/components/copy-text";
import { parsePastedJob, platformName } from "@/lib/job-paste";

/**
 * 「一键抓当前页」的落地页。
 *
 * 解析在**浏览器本地**完成（`job-paste.ts` 是纯函数），所以：粘进来立刻出结果、
 * 原文不经过服务器、也不用等接口。解析不准时你可以直接改，改完再保存。
 *
 * ⚠️ 平台页面结构五花八门，解析**只能尽力而为** —— 所以这里刻意做了三件事：
 *    显示置信度、标出缺哪些字段、所有字段可编辑。宁可让你多看一眼，也不要存进一条错的职位。
 */
export function JobImportForm() {
  const router = useRouter();
  const [raw, setRaw] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // 解析结果 + 用户手工修正的覆盖
  const parsed = useMemo(() => (raw.trim().length >= 10 ? parsePastedJob(raw, url || null) : null), [raw, url]);
  const [fixed, setFixed] = useState<Partial<Record<string, string>>>({});
  const [reqText, setReqText] = useState<string | null>(null);
  const [tagText, setTagText] = useState<string | null>(null);

  const v = (key: "title" | "company" | "location" | "salary" | "description", fallback: string) =>
    fixed[key] ?? fallback;
  const requirements = reqText ?? (parsed?.requirements.join("\n") ?? "");
  const tags = tagText ?? (parsed?.tags.join(" ") ?? "");

  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const bookmarklet = `javascript:(function(){var t=document.title,u=location.href,b=document.body?document.body.innerText:'';if(b.length>20000)b=b.slice(0,20000);var s='【docmind 抓取】\\nurl: '+u+'\\ntitle: '+t+'\\n---\\n'+b;var a=document.createElement('textarea');a.value=s;document.body.appendChild(a);a.select();try{document.execCommand('copy')}catch(e){}document.body.removeChild(a);window.open('${origin}/jobs/import','docmind');})();`;

  async function save() {
    if (!parsed) return;
    setSaving(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/jobs/import-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: raw,
          url: url || null,
          title: v("title", parsed.title),
          company: v("company", parsed.company),
          location: v("location", parsed.location),
          salary: v("salary", parsed.salary),
          description: v("description", parsed.description),
          requirements: requirements.split("\n").map((s) => s.trim()).filter(Boolean),
          tags: tags.split(/[\s,，]+/).map((s) => s.trim()).filter(Boolean),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "保存失败");
      setMsg(`已${json.created ? "存入" : "更新"}职位库：${json.job.title} · ${json.job.company}`);
      setRaw("");
      setFixed({});
      setReqText(null);
      setTagText(null);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <Alert tone="info" icon="i">
        <p className="text-[13px] font-semibold text-fg">平台岗位用这里手动存</p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-fg2">
          在招聘平台看到合适的岗位，把页面内容粘进来，或用下面的书签抓当前页。不自动抓取平台数据。
        </p>
      </Alert>

      <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
        <Field label="把岗位页内容粘到这里（Ctrl+A / Ctrl+C 即可）">
          <Textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={10}
            placeholder="在 BOSS直聘 / 智联 / 猎聘 的岗位页按 Ctrl+A、Ctrl+C，然后粘到这里…"
          />
        </Field>
        <Field label="职位链接（可选，建议填）" hint="填了能点回原帖核对，也用于去重">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.zhipin.com/job_detail/…" />
        </Field>
      </div>

      {parsed ? (
        <div className="space-y-4 rounded-lg border border-border bg-surface p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone="primary">{platformName(parsed.platform)}</Chip>
            <Chip tone={parsed.confidence >= 0.75 ? "success" : "outline"}>
              解析置信度 {Math.round(parsed.confidence * 100)}%
            </Chip>
            <Chip tone={parsed.apply.channel === "email" ? "success" : "muted"}>
              投递方式：{parsed.apply.channel === "email" ? `邮件 ${parsed.apply.email}` : parsed.apply.channel === "link" ? "链接" : parsed.apply.channel === "wechat" ? "微信" : "未识别"}
            </Chip>
          </div>

          {parsed.uncertain.length > 0 ? (
            <p className="text-[12.5px] text-muted-fg">
              下面这些没能自动识别，<strong className="text-fg2">请手动补全</strong>：
              {parsed.uncertain.map((k) => ({ title: "标题", company: "公司", salary: "薪资", location: "地点" })[k as "title"] ?? k).join("、")}
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="职位标题">
              <Input value={v("title", parsed.title)} onChange={(e) => setFixed((p) => ({ ...p, title: e.target.value }))} />
            </Field>
            <Field label="公司">
              <Input value={v("company", parsed.company)} onChange={(e) => setFixed((p) => ({ ...p, company: e.target.value }))} placeholder="没识别出来就填一下" />
            </Field>
            <Field label="地点">
              <Input value={v("location", parsed.location)} onChange={(e) => setFixed((p) => ({ ...p, location: e.target.value }))} />
            </Field>
            <Field label="薪资">
              <Input value={v("salary", parsed.salary)} onChange={(e) => setFixed((p) => ({ ...p, salary: e.target.value }))} />
            </Field>
          </div>

          <Field label="技能标签（空格分隔）">
            <Input value={tags} onChange={(e) => setTagText(e.target.value)} />
          </Field>

          <Field label="任职要求（每行一条）">
            <Textarea value={requirements} onChange={(e) => setReqText(e.target.value)} rows={4} />
          </Field>

          <Field label="职位描述">
            <Textarea value={v("description", parsed.description)} onChange={(e) => setFixed((p) => ({ ...p, description: e.target.value }))} rows={8} />
          </Field>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={save} disabled={saving || !v("title", parsed.title).trim()}>
              {saving ? "保存中…" : "存入职位库"}
            </Button>
            <span className="text-[12px] text-muted-fg">保存后可在详情页记录投递</span>
          </div>
        </div>
      ) : (
        <p className="text-[12.5px] text-muted-fg">粘贴后这里会显示解析结果，可以逐项修改。</p>
      )}

      {msg ? <p className="text-xs text-primary">{msg}</p> : null}
      {err ? <p className="text-xs text-destructive-fg">{err}</p> : null}

      <details className="card overflow-hidden">
        <summary className="cursor-pointer select-none px-5 py-3 text-sm font-medium text-fg2 transition hover:bg-muted">
          ⚡ 书签脚本：在岗位上点一下就能抓当前页
        </summary>
        <div className="border-t border-border p-5">
          <p className="text-[12.5px] leading-relaxed text-fg2">
            新建一个浏览器书签，「网址」粘贴下面这段。以后在岗位页点它，会复制当前页内容并打开本页，
            你按 Ctrl+V 就行。
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <CopyText text={bookmarklet} label="复制书签脚本" />
            <span className="text-[11.5px] text-muted-fg">粘贴到书签的「网址」栏即可</span>
          </div>
          <pre className="mono mt-3 max-h-40 overflow-auto rounded-md bg-muted p-3 text-[11px] leading-relaxed text-fg2">
            {bookmarklet}
          </pre>
          <p className="mt-3 text-[12px] leading-relaxed text-muted-fg">
            书签只在你点击时读取当前页，没有后台请求，不登录，不批量抓取。
          </p>
        </div>
      </details>
    </div>
  );
}
