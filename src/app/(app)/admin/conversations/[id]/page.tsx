import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/db";

export default async function AdminConvDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdmin();

  const conv = await prisma.conversation.findUnique({
    where: { id },
    include: {
      kb: { select: { name: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!conv) notFound();

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/admin/conversations"
          className="text-sm text-zinc-500 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← 返回对话列表
        </Link>
        <h2 className="mt-1 text-lg font-semibold dark:text-zinc-50">
          {conv.title}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          知识库：{conv.kb.name} · 共 {conv.messages.length} 条消息
        </p>
      </div>

      <div className="space-y-3">
        {conv.messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
              }`}
            >
              <p className="mb-1 text-[10px] font-semibold uppercase opacity-60">
                {m.role === "user" ? "用户" : "AI"}
              </p>
              {m.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
