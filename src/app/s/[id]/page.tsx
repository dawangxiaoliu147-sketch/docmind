import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

// 公开分享页：无需登录，只读展示知识库的文档概览
export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const kb = await prisma.knowledgeBase.findFirst({
    where: { id, shared: true },
    include: {
      documents: {
        where: { status: "ready" },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!kb) notFound();

  // 每个文档取第一个片段作为预览
  const docs = await Promise.all(
    kb.documents.map(async (d) => {
      const first = await prisma.chunk.findFirst({
        where: { docId: d.id },
        orderBy: { chunkIndex: "asc" },
        select: { content: true },
      });
      return { ...d, preview: first?.content.slice(0, 200) ?? "" };
    }),
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-2 text-sm font-medium text-indigo-500">🔗 DocMind 知识库分享</div>
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{kb.name}</h1>
      {kb.description && (
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{kb.description}</p>
      )}

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          文档（{docs.length}）
        </h2>
        {docs.length === 0 ? (
          <p className="text-sm text-zinc-400">该知识库暂无已就绪的文档</p>
        ) : (
          <div className="space-y-4">
            {docs.map((d) => (
              <div
                key={d.id}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <h3 className="font-semibold text-zinc-800 dark:text-zinc-100">
                  📄 {d.title}
                </h3>
                <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                  {d.chunkCount} 个片段
                </p>
                {d.preview && (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {d.preview}…
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 border-t border-zinc-200 pt-6 text-center dark:border-zinc-800">
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          由 DocMind 提供 · 基于 RAG 的 AI 智能知识库
        </p>
        <Link
          href="/"
          className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          我也要创建自己的知识库 →
        </Link>
      </div>
    </div>
  );
}
