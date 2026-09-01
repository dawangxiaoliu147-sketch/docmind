import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { createKnowledgeBase, deleteKnowledgeBase } from "@/lib/actions/kb";
import { KbCover } from "@/components/kb-cover";
import { GlobalSearch } from "@/components/global-search";

export default async function DashboardPage() {
  const user = await requireUser();

  const [kbs, docCount, chunkCount] = await Promise.all([
    prisma.knowledgeBase.findMany({
      where: { userId: user.id },
      include: { _count: { select: { documents: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.document.count({ where: { kb: { userId: user.id } } }),
    prisma.chunk.count({ where: { document: { kb: { userId: user.id } } } }),
  ]);

  const stats = [
    { label: "知识库", value: kbs.length, icon: "🗂️" },
    { label: "文档", value: docCount, icon: "📄" },
    { label: "知识片段", value: chunkCount, icon: "🧩" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold dark:text-zinc-50">我的知识库</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          创建知识库 → 上传文档 → 向 AI 提问，三步构建你的专属问答助手
        </p>
      </div>

      {/* 数据统计 */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-2xl dark:bg-indigo-950">
              {s.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {s.value}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 跨知识库搜索 */}
      <GlobalSearch />

      {/* 创建知识库 */}
      <form
        action={createKnowledgeBase}
        className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:flex-row dark:border-zinc-800 dark:bg-zinc-900"
      >
        <input
          name="name"
          required
          placeholder="知识库名称，如「公司产品手册」"
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-indigo-500 dark:focus:ring-indigo-900"
        />
        <input
          name="description"
          placeholder="描述（可选）"
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-indigo-500 dark:focus:ring-indigo-900"
        />
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          创建知识库
        </button>
      </form>

      {/* 知识库列表 */}
      {kbs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/50 px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
          <p className="text-lg font-medium text-zinc-700 dark:text-zinc-200">
            还没有知识库
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            在上方输入名称，创建你的第一个知识库
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kbs.map((kb) => (
            <div
              key={kb.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <Link href={`/kb/${kb.id}`} className="block">
                <KbCover
                  name={kb.name}
                  coverImage={kb.coverImage}
                  color={kb.color}
                  className="h-32 w-full"
                />
              </Link>
              <div className="flex flex-1 flex-col p-5">
                <Link href={`/kb/${kb.id}`} className="flex-1">
                  <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {kb.name}
                  </h2>
                  <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-zinc-500 dark:text-zinc-400">
                    {kb.description || "暂无描述"}
                  </p>
                </Link>
                <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    {kb._count.documents} 个文档
                  </span>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/kb/${kb.id}/chat`}
                      className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-400 dark:hover:bg-indigo-900"
                    >
                      提问
                    </Link>
                    <form action={deleteKnowledgeBase}>
                      <input type="hidden" name="id" value={kb.id} />
                      <button
                        type="submit"
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 transition hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-950 dark:hover:text-red-400"
                      >
                        删除
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
