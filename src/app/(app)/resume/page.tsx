import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { ResumeStudio } from "@/components/resume-studio";

export const metadata: Metadata = {
  title: "简历工坊 · DocMind",
};

export default async function ResumePage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold dark:text-zinc-50">📝 简历工坊</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          挑选模板 → 填写信息 → AI 生成专业简历
        </p>
      </div>

      <ResumeStudio />
    </div>
  );
}
