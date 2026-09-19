import Link from "next/link";
import { notFound } from "next/navigation";
import type { UIMessage } from "ai";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { ChatShell } from "@/components/chat-shell";
import { PageHeader, buttonClass } from "@/components/ui";

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
      <Link
        href={`/kb/${id}`}
        className={buttonClass({
          variant: "link",
          className: "mb-3 self-start text-muted-fg",
        })}
      >
        ← 返回
      </Link>
      <PageHeader
        eyebrow="chat"
        title={`与「${kb.name}」对话`}
        className="shrink-0"
      />
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
