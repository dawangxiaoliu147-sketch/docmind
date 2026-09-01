import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { deleteDocument, toggleShare } from "@/lib/actions/kb";
import { UploadForm } from "@/components/upload-form";
import { KbCover } from "@/components/kb-cover";
import { CoverUpload } from "@/components/cover-upload";
import { KbEditForm } from "@/components/kb-edit-form";
import { KbSummary } from "@/components/kb-summary";
import { KbGraph } from "@/components/kb-graph";
import { ShareLink } from "@/components/share-link";

const STATUS_LABEL: Record<string, { text: string; className: string }> = {
  processing: { text: "处理中", className: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400" },
  ready: { text: "已就绪", className: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400" },
  failed: { text: "失败", className: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400" },
};

export default async function KbPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const kb = await prisma.knowledgeBase.findFirst({
    where: { id, userId: user.id },
    include: { documents: { orderBy: { createdAt: "desc" } } },
  });
  if (!kb) notFound();

  return (
    <div className="space-y-6">
      <KbCover
        name={kb.name}
        coverImage={kb.coverImage}
        color={kb.color}
        className="h-44 w-full rounded-2xl"
      />

      <div className="flex items-start justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-zinc-500 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              ← 返回
            </Link>
            <h1 className="text-2xl font-semibold dark:text-zinc-50">{kb.name}</h1>
          </div>
          {kb.description && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{kb.description}</p>
          )}
          <div className="mt-3">
            <CoverUpload kbId={kb.id} hasCover={!!kb.coverImage} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/kb/${kb.id}/quiz`}
            className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-400 dark:hover:bg-indigo-900"
          >
            🎯 知识测验
          </Link>
          <Link
            href={`/kb/${kb.id}/chat`}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            开始提问
          </Link>
        </div>
      </div>

      {/* AI 摘要 */}
      <details className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <summary className="cursor-pointer select-none px-5 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800/50">
          ✨ AI 摘要（一键总结这个知识库）
        </summary>
        <div className="border-t border-zinc-100 p-5 dark:border-zinc-800">
          <KbSummary kbId={kb.id} />
        </div>
      </details>

      {/* 编辑知识库 */}
      <details className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <summary className="cursor-pointer select-none px-5 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800/50">
          ✏️ 编辑知识库（重命名 / 描述 / 主题色）
        </summary>
        <div className="border-t border-zinc-100 p-5 dark:border-zinc-800">
          <KbEditForm
            kbId={kb.id}
            name={kb.name}
            description={kb.description}
            color={kb.color}
          />
        </div>
      </details>

      {/* AI 知识图谱 */}
      <details className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <summary className="cursor-pointer select-none px-5 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800/50">
          🗺️ 知识图谱（AI 自动梳理知识结构）
        </summary>
        <div className="border-t border-zinc-100 p-5 dark:border-zinc-800">
          <KbGraph kbId={kb.id} />
        </div>
      </details>

      {/* 分享知识库 */}
      <details className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <summary className="cursor-pointer select-none px-5 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800/50">
          🔗 分享知识库（生成只读链接）
        </summary>
        <div className="border-t border-zinc-100 p-5 dark:border-zinc-800">
          <form action={toggleShare}>
            <input type="hidden" name="id" value={kb.id} />
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              {kb.shared ? "🔒 取消分享" : "🔗 开启分享"}
            </button>
          </form>
          {kb.shared && (
            <div className="mt-4">
              <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
                分享链接（任何人打开都能只读查看，无需登录）：
              </p>
              <ShareLink path={`/s/${kb.id}`} />
            </div>
          )}
        </div>
      </details>

      <UploadForm kbId={kb.id} />

      <div>
        <h2 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          文档（{kb.documents.length}）
        </h2>
        {kb.documents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/50 px-6 py-12 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400">
            还没有文档，上传一个 PDF / Markdown / TXT 文件开始吧
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {kb.documents.map((doc) => {
              const status = STATUS_LABEL[doc.status] ?? STATUS_LABEL.processing;
              return (
                <li
                  key={doc.id}
                  className="flex items-center justify-between px-5 py-3.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="text-lg">📄</span>
                    <div className="min-w-0">
                      <Link
                        href={`/kb/${kb.id}/docs/${doc.id}`}
                        className="block truncate text-sm font-medium transition hover:text-indigo-600 dark:text-zinc-100 dark:hover:text-indigo-400"
                      >
                        {doc.title}
                      </Link>
                      <p className="truncate text-xs text-zinc-400 dark:text-zinc-500">
                        {doc.fileName} · {formatSize(doc.size)}
                        {doc.status === "ready" && ` · ${doc.chunkCount} 片段`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}
                    >
                      {status.text}
                    </span>
                    <form action={deleteDocument}>
                      <input type="hidden" name="docId" value={doc.id} />
                      <input type="hidden" name="kbId" value={kb.id} />
                      <button
                        type="submit"
                        className="text-xs font-medium text-zinc-400 transition hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400"
                      >
                        删除
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
