import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { getJob } from "@/lib/job-store";
import { ResumeMatch } from "@/components/resume-match";
import { JobInterview } from "@/components/job-interview";
import { TourButton } from "@/components/onboarding-tour";
import { buttonClass, Chip, PageHeader, Panel, Stack } from "@/components/ui";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser();

  const job = await getJob(id);
  if (!job) notFound();

  return (
    <Stack>
      <PageHeader
        eyebrow="job"
        title={job.title}
        subtitle={
          <>
            {job.company} · {job.location} ·{" "}
            <span className="font-medium text-primary">{job.salary}</span>
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

      <Panel className="p-6">
        <h2 className="text-sm font-semibold text-fg">职位描述</h2>
        <p className="mt-2 text-sm leading-relaxed text-fg2">{job.description}</p>
      </Panel>

      <Panel className="p-6">
        <h2 className="text-sm font-semibold text-fg">任职要求</h2>
        <ul className="mt-2 space-y-1.5 text-sm text-fg2">
          {job.requirements.map((r) => (
            <li key={r}>• {r}</li>
          ))}
        </ul>
      </Panel>

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

      <ResumeMatch jobId={job.id} />

      <JobInterview jobId={job.id} />
    </Stack>
  );
}
