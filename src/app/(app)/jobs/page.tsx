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

export default async function JobsPage() {
  await requireUser();
  const jobs = await getAllJobs();

  return (
    <Stack>
      <PageHeader
        eyebrow="jobs"
        title="职位库"
        subtitle="浏览职位，或上传简历让 AI 推荐匹配岗位"
        actions={
          <>
            <TourButton tour="jobs" />
            <Link href="/jobs/new" className={buttonClass({ pill: true })}>
              ＋ 添加职位
            </Link>
          </>
        }
      />

      {/* 真实职位同步：这一块负责"把假数据换成真岗位"，放在推荐与列表之前 */}
      <Section title="职位同步（真实数据源）" extra="公开源 · 不爬招聘平台" data-tour="jobs-sync">
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
