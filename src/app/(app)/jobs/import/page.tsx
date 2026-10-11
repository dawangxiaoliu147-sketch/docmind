import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { JobImportForm } from "@/components/job-import-form";
import { buttonClass, PageHeader, Section, Stack } from "@/components/ui";

export const metadata: Metadata = {
  title: "导入岗位 · 知行",
};

/**
 * 「一键抓当前页」的入口。
 * 平台岗位（BOSS/智联/猎聘…）不走自动爬 —— 那要挂你的账号、绕反爬，代价是你的账号和服务器 IP。
 * 这里走的是"你正常浏览 + 一键抓当前页"，详见 JobImportForm 里的说明。
 */
export default async function JobImportPage() {
  await requireUser();

  return (
    <Stack>
      <PageHeader
        eyebrow="jobs / import"
        title="抓取当前岗位"
        subtitle="把招聘平台上的岗位存进职位库"
        actions={
          <Link href="/jobs" className={buttonClass({ variant: "ghost", size: "sm" })}>
            ← 返回职位库
          </Link>
        }
      />

      <Section title="粘贴 / 书签抓取">
        <JobImportForm />
      </Section>
    </Stack>
  );
}
