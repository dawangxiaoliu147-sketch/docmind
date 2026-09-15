import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { AgentPanel } from "@/components/agent-panel";

export const metadata: Metadata = {
  title: "智能体 · 知行",
};

export default async function AgentPage() {
  await requireUser();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold dark:text-zinc-50">🤖 知行智能体</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          通用 Agent Harness：自主调用工具，打通你项目的全部能力
        </p>
      </div>
      <AgentPanel />
    </div>
  );
}
