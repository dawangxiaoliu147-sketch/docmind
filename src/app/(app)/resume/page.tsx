import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { ResumeEditor } from "@/components/resume-editor";

export const metadata: Metadata = {
  title: "简历 · 知行",
};

export default async function ResumePage() {
  await requireUser();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">
          <i aria-hidden="true">⊡</i>简历工坊
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          A4 标准简历模板 · 在线编辑 · 主题色 · 智能体自动修改 · 导出 HTML / PDF
        </p>
      </div>
      <ResumeEditor />
    </div>
  );
}
