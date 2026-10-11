import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { getJob } from "@/lib/job-store";
import { getApplicationForJob } from "@/lib/applications";
import type { Channel } from "@/lib/application-status";
import { ResumeMatch } from "@/components/resume-match";
import { JobInterview } from "@/components/job-interview";
import { CopyText } from "@/components/copy-text";
import { ApplicationPanel } from "@/components/application-panel";
import { TourButton } from "@/components/onboarding-tour";
import type { ChipTone } from "@/components/ui";
import { buttonClass, Chip, PageHeader, Panel, Stack } from "@/components/ui";

const SOURCE_LABEL: Record<string, string> = {
  v2ex: "V2EX 招聘节点",
  eleduck: "电鸭社区",
  rss: "自定义 RSS 源",
  csv: "CSV 导入",
  manual: "手动添加",
  demo: "内置示例（假数据）",
};

const CHANNEL: Record<string, { text: string; tone: ChipTone; hint: string }> = {
  email: { text: "可邮件投递", tone: "success", hint: "帖子里直接给了邮箱，这是最可自动化、也最合规的渠道。" },
  link: { text: "有投递链接", tone: "primary", hint: "原帖给了 ATS / 表单链接，需要你点进去提交。" },
  wechat: { text: "微信联系", tone: "muted", hint: "只给了微信/TG，需要人工联系。" },
  unknown: { text: "未注明投递方式", tone: "muted", hint: "原帖没有明确投递方式，建议点开原帖看看评论区。" },
};

function shanghai(iso: Date): string {
  return new Date(iso).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const job = await getJob(id);
  if (!job) notFound();

  const application = await getApplicationForJob(user.id, job.id);

  // 默认投递渠道：邮件岗位给 email；平台来源给对应平台
  const platformChannels: Channel[] = ["boss", "zhilian", "liepin", "51job", "lagou"];
  const defaultChannel: Channel =
    job.applyChannel === "email"
      ? "email"
      : platformChannels.includes(job.source as Channel)
        ? (job.source as Channel)
        : "other";

  const channel = CHANNEL[job.applyChannel ?? "unknown"] ?? CHANNEL.unknown;
  const email = job.applyChannel === "email" ? job.applyEmail : null;
  const mailto = email
    ? `mailto:${email}?subject=${encodeURIComponent(`应聘：${job.title}`)}`
    : null;

  return (
    <Stack>
      <PageHeader
        eyebrow="job"
        title={job.title}
        subtitle={
          <>
            {job.company}
            {job.location ? ` · ${job.location}` : ""}
            {job.salary ? (
              <>
                {" · "}
                <span className="font-medium text-primary">{job.salary}</span>
              </>
            ) : null}
          </>
        }
        actions={
          <>
            <TourButton tour="jobdetail" />
            <Link href="/jobs" className={buttonClass({ variant: "ghost", size: "sm" })}>
              ← 返回职位库
            </Link>
          </>
        }
      />

      {/* 投递方式：这一块才是"真正去投"的入口，放在最前面 */}
      <Panel className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-fg">怎么投递</h2>
            <p className="mt-1 text-[12.5px] text-muted-fg">
              来源：{SOURCE_LABEL[job.source] ?? job.source}
              {job.postedAt ? ` · 原帖发布于 ${shanghai(job.postedAt)}` : ""}
            </p>
          </div>
          <Chip tone={channel.tone}>{channel.text}</Chip>
        </div>

        <p className="mt-2 text-[12.5px] leading-relaxed text-muted-fg">{channel.hint}</p>

        {email ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <code className="mono rounded-md bg-muted px-3 py-2 text-sm text-fg">{email}</code>
            <CopyText text={email} label="复制邮箱" />
            {mailto ? (
              <a href={mailto} className={buttonClass({ size: "sm" })}>
                写邮件应聘
              </a>
            ) : null}
          </div>
        ) : null}

        {job.applyUrl ? (
          <div className="mt-4">
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass({ variant: "outline", size: "sm" })}
            >
              打开投递页面 ↗
            </a>
            <p className="mono mt-2 break-all text-[11.5px] text-muted-fg">{job.applyUrl}</p>
          </div>
        ) : null}

        {job.contact ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-fg2">
            <span>
              其他联系方式：<span className="mono">{job.contact}</span>
            </span>
            <CopyText text={job.contact} label="复制" />
          </div>
        ) : null}

        <div className="mt-4 border-t border-border pt-3 text-[12.5px] leading-relaxed text-muted-fg">
          {job.url ? (
            <>
              原帖：
              <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                点开核对 ↗
              </a>
            </>
          ) : (
            "这条没有原帖链接（手动添加或 CSV 导入）"
          )}
          {job.fetchedAt ? ` · 同步于 ${shanghai(job.fetchedAt)}` : ""}
        </div>

        <p className="mt-3 text-[12px] leading-relaxed text-muted-fg">
          邮箱是从原帖正文里自动抽出来的，<strong className="text-fg2">投递前请点开原帖核对一遍</strong>。
          本工具不代替你发信、也不登录任何招聘平台。
        </p>
      </Panel>

      {/* 投递跟进：平台上的提交由你自己点，这里负责记录状态、提醒跟进 */}
      <Panel className="p-6">
        <h2 className="text-sm font-semibold text-fg">投递跟进</h2>
        <div className="mt-3">
          <ApplicationPanel
            jobId={job.id}
            defaultChannel={defaultChannel}
            initial={
              application
                ? {
                    id: application.id,
                    status: application.status,
                    channel: application.channel,
                    note: application.note,
                    nextFollowUp: application.nextFollowUp
                      ? application.nextFollowUp.toISOString()
                      : null,
                    appliedAt: application.appliedAt ? application.appliedAt.toISOString() : null,
                    timeline: application.timeline,
                  }
                : null
            }
          />
        </div>
      </Panel>

      <Panel className="p-6">
        <h2 className="text-sm font-semibold text-fg">职位描述</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-fg2">{job.description}</p>
      </Panel>

      {job.requirements.length > 0 ? (
        <Panel className="p-6">
          <h2 className="text-sm font-semibold text-fg">任职要求</h2>
          <ul className="mt-2 space-y-1.5 text-sm text-fg2">
            {job.requirements.map((r) => (
              <li key={r}>• {r}</li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {job.tags.length > 0 ? (
        <Panel className="p-6">
          <h2 className="text-sm font-semibold text-fg">技能标签</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {job.tags.map((t) => (
              <Chip key={t} tone="primary">
                {t}
              </Chip>
            ))}
          </div>
        </Panel>
      ) : null}

      <ResumeMatch jobId={job.id} />

      <JobInterview jobId={job.id} />
    </Stack>
  );
}
