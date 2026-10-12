import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { getAllJobs } from "@/lib/job-store";
import { ResumeRecommend } from "@/components/resume-recommend";
import { JobsBrowser } from "@/components/jobs-browser";
import { JobSyncPanel } from "@/components/job-sync-panel";
import { TourButton } from "@/components/onboarding-tour";
import { buttonClass, PageHeader, Section, Stack } from "@/components/ui";

export const metadata: Metadata = {
  title: "职位库 · 知行",
};

/**
 * 旧的职位库：把岗位存进库里、同步公开源、手动抓取。
 * 找岗位的主入口已经改成 /jobs 的搜索 Agent，这里保留为备用（导览按钮也在这边，
 * 因为导览要高亮的元素都在这个页面上）。
 */
export default async function JobLibraryPage() {
  await requireUser();
  const jobs = await getAllJobs();

  return (
    <Stack>
      <PageHeader
        eyebrow="jobs / library"
        title="职位库"
        subtitle="把岗位存进库里，或者同步公开源"
        actions={
          <>
            <TourButton tour="jobs" />
            <Link href="/jobs" className={buttonClass({ variant: "outline", size: "sm" })}>
              ← 回找岗位
            </Link>
            <Link href="/jobs/import" className={buttonClass({ variant: "outline", size: "sm" })}>
              ⚡ 抓取岗位
            </Link>
            <Link href="/jobs/new" className={buttonClass({ pill: true })}>
              ＋ 添加职位
            </Link>
          </>
        }
      />

      <Section title="职位同步" extra="公开源" data-tour="jobs-sync">
        <JobSyncPanel />
      </Section>

      <div data-tour="jobs-recommend">
        <ResumeRecommend />
      </div>

      <Section title="全部职位" extra={`${jobs.length} 条`} data-tour="jobs-list">
        <JobsBrowser jobs={jobs} />
      </Section>
    </Stack>
  );
}
