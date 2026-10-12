import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { JobSearchAgent } from "@/components/job-search-agent";
import { TourButton } from "@/components/onboarding-tour";
import { buttonClass, PageHeader, Section, Stack } from "@/components/ui";

export const metadata: Metadata = {
  title: "找岗位 · 知行",
};

export default async function JobsPage() {
  const user = await requireUser();
  const resumes = await prisma.resume.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true },
  });

  return (
    <Stack>
      <PageHeader
        eyebrow="jobs"
        title="找岗位"
        subtitle="给 AI 你的简历和目标，它把各平台的搜索链接准备好，你点开自己看"
        actions={
          <>
            <TourButton tour="jobs" />
            <Link href="/applications" className={buttonClass({ variant: "outline", size: "sm" })}>
              投递跟进
            </Link>
            <Link href="/resume" className={buttonClass({ variant: "outline", size: "sm" })}>
              简历工坊
            </Link>
          </>
        }
      />

      <Section title="搜索 Agent">
        <JobSearchAgent
          resumes={resumes.map((r) => ({
            id: r.id,
            title: r.title,
            updatedAt: r.updatedAt.toISOString(),
          }))}
        />
      </Section>

      <p className="text-[12px] leading-relaxed text-muted-fg">
        平台不开放给程序查询，所以这里只把搜索词和链接准备好。点开之后是你自己的账号在搜，跟手动打开平台一样。
      </p>
    </Stack>
  );
}
