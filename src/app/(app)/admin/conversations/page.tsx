import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/db";

export default async function AdminConvsPage() {
  await requireAdmin();

  const convs = await prisma.conversation.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      kb: { select: { name: true, user: { select: { email: true } } } },
      _count: { select: { messages: true } },
    },
  });

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold dark:text-zinc-100">
          对话（{convs.length}）
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400">
            <tr>
              <th className="px-5 py-3 font-medium">标题</th>
              <th className="px-5 py-3 font-medium">知识库</th>
              <th className="px-5 py-3 font-medium">所属用户</th>
              <th className="px-5 py-3 font-medium">消息数</th>
              <th className="px-5 py-3 font-medium">更新时间</th>
              <th className="px-5 py-3 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {convs.map((c) => (
              <tr key={c.id}>
                <td className="max-w-[240px] truncate px-5 py-3 font-medium dark:text-zinc-100">
                  {c.title}
                </td>
                <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400">
                  {c.kb.name}
                </td>
                <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400">
                  {c.kb.user.email}
                </td>
                <td className="px-5 py-3 dark:text-zinc-300">
                  {c._count.messages}
                </td>
                <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400">
                  {c.updatedAt.toLocaleString()}
                </td>
                <td className="px-5 py-3 text-right">
                  <Link
                    href={`/admin/conversations/${c.id}`}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950"
                  >
                    查看
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
