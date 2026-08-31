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
    select: { id: true, name: true, email: true, createdAt: true },
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold dark:text-zinc-100">最近注册用户</h2>
        <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
          {recentUsers.map((u) => (
            <li
              key={u.id}
              className="flex items-center justify-between py-3 text-sm"
            >
              <span className="font-medium dark:text-zinc-100">{u.name}</span>
              <span className="text-zinc-500 dark:text-zinc-400">{u.email}</span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                {u.createdAt.toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
