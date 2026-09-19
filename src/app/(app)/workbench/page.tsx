import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { WORK_AGENTS } from "@/lib/work-agents";
import { TourButton } from "@/components/onboarding-tour";
import {
  Card,
  CardGrid,
  Chip,
  IconBox,
  PageHeader,
  Panel,
  Stack,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "工作台 · 知行",
};

export default async function WorkbenchPage() {
  await requireUser();

  return (
    <Stack>
      <PageHeader
        eyebrow="workbench"
        title="工作台"
        subtitle="一组工作用途的 AI 助手，随取随用"
        actions={
          <>
            <Chip tone="primary" className="num">
              {WORK_AGENTS.length} 个助手
            </Chip>
            <TourButton tour="workbench" />
          </>
        }
      />

      <Panel className="ui-rail p-5 pl-6" data-tour="workbench-note">
        <p className="text-[13px] font-semibold text-fg">每个助手都有自己的系统提示词</p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted-fg">
          「简历优化」按 STAR 法则改写并量化成果；「周报汇报」替你分好本周完成 / 数据成果 / 问题 / 下周计划；
          「面试模拟」一次只问一个问题并追问点评。这些助手**不依赖知识库**，点进去直接对话。
        </p>
      </Panel>

      <CardGrid data-tour="workbench-grid">
        {WORK_AGENTS.map((a) => (
          <Link key={a.id} href={`/workbench/${a.id}`} className="block min-w-0">
            <Card hover pad className="h-full">
              <div className="flex items-start gap-3">
                <IconBox size="lg">{a.icon}</IconBox>
                <div className="min-w-0">
                  <h3 className="text-[13.5px] font-semibold text-fg">{a.name}</h3>
                  <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-muted-fg">
                    {a.description}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </CardGrid>
    </Stack>
  );
}
