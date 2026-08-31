import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { deleteAnyKb } from "@/lib/actions/admin";

export default async function AdminKbsPage() {
  await requireAdmin();

  const kbs = await prisma.knowledgeBase.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { documents: true, conversations: true } },
    },
  });

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold dark:text-zinc-100">
          知识库（{kbs.length}）
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400">
            <tr>
              <th className="px-5 py-3 font-medium">名称</th>
              <th className="px-5 py-3 font-medium">所属用户</th>
              <th className="px-5 py-3 font-medium">文档</th>
              <th className="px-5 py-3 font-medium">对话</th>
              <th className="px-5 py-3 font-medium">创建时间</th>
              <th className="px-5 py-3 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {kbs.map((kb) => (
              <tr key={kb.id}>
                <td className="px-5 py-3 font-medium dark:text-zinc-100">
                  {kb.name}
                </td>
                <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400">
                  {kb.user.email}
                </td>
                <td className="px-5 py-3 dark:text-zinc-300">
                  {kb._count.documents}
                </td>
                <td className="px-5 py-3 dark:text-zinc-300">
                  {kb._count.conversations}
                </td>
                <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400">
                  {kb.createdAt.toLocaleDateString()}
                </td>
                <td className="px-5 py-3 text-right">
                  <form action={deleteAnyKb}>
                    <input type="hidden" name="id" value={kb.id} />
                    <button
                      type="submit"
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                    >
                      删除
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
