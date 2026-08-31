import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { getChunksByDoc } from "@/lib/vector";

export default async function DocPreviewPage({
  params,
}: {
  params: Promise<{ id: string; docId: string }>;
}) {
  const { id, docId } = await params;
  const user = await requireUser();

  const kb = await prisma.knowledgeBase.findFirst({
    where: { id, userId: user.id },
  });
  if (!kb) notFound();

  const doc = await prisma.document.findFirst({
    where: { id: docId, kbId: id },
  });
  if (!doc) notFound();

  const chunks = await getChunksByDoc(docId);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/kb/${id}`}
          className="text-sm text-zinc-500 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← 返回「{kb.name}」
        </Link>
        <h1 className="mt-2 text-2xl font-semibold dark:text-zinc-50">
          {doc.title}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {doc.fileName} · 共 {chunks.length} 个知识片段
        </p>
      </div>

      {chunks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/50 px-6 py-12 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400">
          该文档暂无已处理的片段
        </div>
      ) : (
        <div className="space-y-3">
          {chunks.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  片段 {c.chunkIndex + 1}
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {c.content.length} 字符
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                {c.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
