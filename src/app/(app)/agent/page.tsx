import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { AgentPanel } from "@/components/agent-panel";
import { TourButton } from "@/components/onboarding-tour";
import { PageHeader, Stack } from "@/components/ui";

export const metadata: Metadata = {
  title: "智能体 · 知行",
};

export default async function AgentPage() {
  await requireUser();

  return (
    <Stack>
      <PageHeader
        eyebrow="agent"
        title="知行智能体"
        subtitle="通用 Agent Harness：自主调用工具，打通你项目的全部能力"
        actions={<TourButton tour="agent" />}
      />
      <AgentPanel />
    </Stack>
  );
}
