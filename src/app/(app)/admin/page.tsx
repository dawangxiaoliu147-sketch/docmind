import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/db";

export default async function AdminDashboard() {
  await requireAdmin();

  const [users, kbs, docs, chunks, convs, msgs] = await Promise.all([
    prisma.user.count(),
    prisma.knowledgeBase.count(),
    prisma.document.count(),
    prisma.chunk.count(),
    prisma.conversation.count(),
    prisma.message.count(),
  ]);

  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  const stats = [
    { label: "用户", value: users, icon: "👤" },
    { label: "知识库", value: kbs, icon: "🗂️" },
    { label: "文档", value: docs, icon: "📄" },
    { label: "知识片段", value: chunks, icon: "🧩" },
    { label: "对话", value: convs, icon: "💬" },
    { label: "消息", value: msgs, icon: "✉️" },
  ];

  return (
    <div className="space-y-6">
      {/* 顶部横幅 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 p-6 text-white">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <h1 className="text-2xl font-bold">🛠️ 管理后台</h1>
        <p className="mt-1 text-sm text-indigo-100">
          平台数据总览 · 共 {users} 位用户，{kbs} 个知识库
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="group flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-800"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-2xl transition group-hover:scale-110 dark:bg-indigo-950">
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

      {/* 最近注册用户 */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold dark:text-zinc-100">最近注册用户</h2>
        <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
          {recentUsers.map((u) => (
            <li key={u.id} className="flex items-center gap-3 py-3 text-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-medium dark:text-zinc-100">
                  {u.name}
                  {u.role === "admin" && (
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                      管理员
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-zinc-400 dark:text-zinc-500">
                  {u.email}
                </p>
              </div>
              <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
                {u.createdAt.toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
