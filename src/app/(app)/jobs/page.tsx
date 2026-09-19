import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { getAllJobs } from "@/lib/job-store";
import { ResumeRecommend } from "@/components/resume-recommend";
import { JobsBrowser } from "@/components/jobs-browser";
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

      <div data-tour="jobs-recommend">
        <ResumeRecommend />
      </div>

      <Section title="全部职位" extra={`${jobs.length} 条`} data-tour="jobs-list">
        <JobsBrowser jobs={jobs} />
      </Section>
    </Stack>
  );
}
