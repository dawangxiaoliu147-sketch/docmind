import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { JOBS } from "@/lib/jobs";
import { ResumeRecommend } from "@/components/resume-recommend";
import { JobsBrowser } from "@/components/jobs-browser";

export const metadata: Metadata = {
  title: "职位库 · DocMind",
};

export default async function JobsPage() {
  await requireUser();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold dark:text-zinc-50">职位库</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          浏览职位，或上传简历让 AI 推荐匹配岗位
        </p>
      </div>

      <ResumeRecommend />

      <JobsBrowser jobs={JOBS} />
    </div>
  );
}
