import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { ResumeEditor } from "@/components/resume-editor";
import { TourButton } from "@/components/onboarding-tour";
import { PageHeader, Stack } from "@/components/ui";

export const metadata: Metadata = {
  title: "简历 · 知行",
};

export default async function ResumePage() {
  await requireUser();

  return (
    <Stack>
      <PageHeader
        eyebrow="resume"
        title="简历工坊"
        subtitle="A4 标准简历模板 · 在线编辑 · 主题色 · 智能体自动修改 · 导出 HTML / PDF"
        actions={<TourButton tour="resume" />}
      />
      <ResumeEditor />
    </Stack>
  );
}
