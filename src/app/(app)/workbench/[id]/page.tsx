import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { getWorkAgent } from "@/lib/work-agents";
import { WorkChatPanel } from "@/components/work-chat-panel";

export default async function WorkbenchToolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser();

  const agent = getWorkAgent(id);
  if (!agent) notFound();

  return (
    <div className="flex h-[calc(100vh-7.5rem)] flex-col">
      <div className="mb-3 flex items-center gap-3">
        <Link
          href="/workbench"
          className="text-sm text-zinc-500 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← 返回工作台
        </Link>
      </div>
      <WorkChatPanel
        agentId={agent.id}
        agentName={agent.name}
        agentIcon={agent.icon}
      />
    </div>
  );
}
