import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { getJob } from "@/lib/job-store";
import { getApplicationForJob } from "@/lib/applications";
import type { Channel } from "@/lib/application-status";
import { extractApplicant } from "@/lib/job-email";
import { jobSourceLabel } from "@/lib/job-labels";
import { ResumeMatch } from "@/components/resume-match";
import { JobInterview } from "@/components/job-interview";
import { CopyText } from "@/components/copy-text";
import { ApplicationPanel } from "@/components/application-panel";
import { EmailDraft } from "@/components/email-draft";
import { TourButton } from "@/components/onboarding-tour";
import type { ChipTone } from "@/components/ui";
import { buttonClass, Chip, PageHeader, Panel, Stack } from "@/components/ui";

const CHANNEL: Record<string, { text: string; tone: ChipTone; hint: string }> = {
  email: { text: "可邮件投递", tone: "success", hint: "原帖留了邮箱，可以直接投。" },
  link: { text: "有投递链接", tone: "primary", hint: "原帖给了投递链接。" },
  wechat: { text: "微信联系", tone: "muted", hint: "原帖只留了微信或 TG。" },
  unknown: { text: "未注明投递方式", tone: "muted", hint: "原帖没写投递方式。" },
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

  // 邮件投递助手：用最新一份简历生成主题与正文（没有简历就用账号名兜底）
  const resume = email
    ? await prisma.resume.findFirst({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
        select: { title: true, html: true },
      })
    : null;
  const applicant = email ? extractApplicant(resume?.html ?? null, user.name) : null;

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
              来源：{jobSourceLabel(job.source)}
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
          邮箱是从原帖正文里自动抽的，投递前点开原帖核对一下。
        </p>
      </Panel>

      {/* 邮件投递助手：无需交出邮箱授权码也能把"投递"走完 */}
      {email && applicant ? (
        <Panel className="p-6">
          <h2 className="text-sm font-semibold text-fg">邮件投递助手</h2>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted-fg">
            按岗位和简历生成主题与正文，复制到你自己的邮箱发送。
            {resume ? ` 用的简历：${resume.title}` : " 还没有简历，建议先去简历工坊建一份。"}
          </p>
          <div className="mt-4">
            <EmailDraft
              jobId={job.id}
              job={{
                title: job.title,
                company: job.company,
                location: job.location,
                salary: job.salary,
                description: job.description,
                applyEmail: email,
                source: job.source,
                url: job.url,
              }}
              applicant={applicant}
              hasApplication={!!application}
            />
          </div>
        </Panel>
      ) : null}

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
