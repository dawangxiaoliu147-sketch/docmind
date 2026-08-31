import Link from "next/link";
import { notFound } from "next/navigation";
import type { UIMessage } from "ai";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { ChatShell } from "@/components/chat-shell";

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ conv?: string; agent?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireUser();

  const kb = await prisma.knowledgeBase.findFirst({
    where: { id, userId: user.id },
    include: {
      documents: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { title: true },
      },
    },
  });
  if (!kb) notFound();

  const conversations = await prisma.conversation.findMany({
    where: { kbId: id, userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true },
  });

  const convId = sp.conv ?? "";
  const agentMode = sp.agent ?? "assistant";
  let initialMessages: UIMessage[] = [];
  if (convId) {
    const conv = await prisma.conversation.findFirst({
      where: { id: convId, kbId: id, userId: user.id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (conv) {
      initialMessages = conv.messages.map((m) => ({
        id: m.id,
        role: (m.role === "assistant" ? "assistant" : "user") as
          | "user"
          | "assistant",
        parts: [{ type: "text" as const, text: m.content }],
      }));
    }
  }

  return (
    <div className="flex h-[calc(100vh-7.5rem)] flex-col">
      <div className="mb-3 flex items-center gap-3">
        <Link
          href={`/kb/${id}`}
          className="text-sm text-zinc-500 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← 返回
        </Link>
        <h1 className="text-lg font-semibold dark:text-zinc-50">
          与「{kb.name}」对话
        </h1>
      </div>
      <ChatShell
        kbId={id}
        conversations={conversations}
        initialConvId={convId}
        initialMessages={initialMessages}
        docTitles={kb.documents.map((d) => d.title)}
        agentMode={agentMode}
      />
    </div>
  );
}
