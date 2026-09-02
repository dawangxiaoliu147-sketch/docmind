import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { getAllJobs } from "@/lib/job-store";
import { ResumeRecommend } from "@/components/resume-recommend";
import { JobsBrowser } from "@/components/jobs-browser";

export const metadata: Metadata = {
  title: "职位库 · 文档生活助手",
};

export default async function JobsPage() {
  await requireUser();
  const jobs = await getAllJobs();

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold dark:text-zinc-50">职位库</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            浏览职位，或上传简历让 AI 推荐匹配岗位
          </p>
        </div>
        <Link
          href="/jobs/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          ＋ 添加职位
        </Link>
      </div>

      <ResumeRecommend />

      <JobsBrowser jobs={jobs} />
    </div>
  );
}
