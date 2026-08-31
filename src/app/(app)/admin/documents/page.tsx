import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/db";

export default async function AdminDocsPage() {
  await requireAdmin();

  const docs = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      kb: { select: { name: true, user: { select: { email: true } } } },
    },
  });

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold dark:text-zinc-100">
          文档（{docs.length}）
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400">
            <tr>
              <th className="px-5 py-3 font-medium">标题</th>
              <th className="px-5 py-3 font-medium">知识库</th>
              <th className="px-5 py-3 font-medium">所属用户</th>
              <th className="px-5 py-3 font-medium">状态</th>
              <th className="px-5 py-3 font-medium">片段数</th>
              <th className="px-5 py-3 font-medium">上传时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {docs.map((d) => (
              <tr key={d.id}>
                <td className="max-w-[220px] truncate px-5 py-3 font-medium dark:text-zinc-100">
                  {d.title}
                </td>
                <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400">
                  {d.kb.name}
                </td>
                <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400">
                  {d.kb.user.email}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      d.status === "ready"
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                        : d.status === "failed"
                          ? "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
                          : "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
                    }`}
                  >
                    {d.status}
                  </span>
                </td>
                <td className="px-5 py-3 dark:text-zinc-300">{d.chunkCount}</td>
                <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400">
                  {d.createdAt.toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
