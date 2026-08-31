import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/db";

export default async function AchievementsPage() {
  const user = await requireUser();

  const [kbCount, docCount, convCount, chunkCount] = await Promise.all([
    prisma.knowledgeBase.count({ where: { userId: user.id } }),
    prisma.document.count({ where: { kb: { userId: user.id } } }),
    prisma.conversation.count({ where: { kb: { userId: user.id } } }),
    prisma.chunk.count({ where: { document: { kb: { userId: user.id } } } }),
  ]);

  const achievements = [
    { icon: "🗂️", title: "初建知识库", desc: "创建第一个知识库", unlocked: kbCount >= 1 },
    { icon: "📄", title: "文档收藏家", desc: "上传 5 个文档", unlocked: docCount >= 5 },
    { icon: "📚", title: "文档大师", desc: "上传 20 个文档", unlocked: docCount >= 20 },
    { icon: "💬", title: "首次提问", desc: "发起第一次对话", unlocked: convCount >= 1 },
    { icon: "🗣️", title: "提问达人", desc: "发起 10 次对话", unlocked: convCount >= 10 },
    { icon: "🧩", title: "知识渊博", desc: "累计 50 个知识片段", unlocked: chunkCount >= 50 },
  ];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold dark:text-zinc-50">成就</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          已解锁 {unlockedCount} / {achievements.length}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((a) => (
          <div
            key={a.title}
            className={`rounded-2xl border p-5 ${
              a.unlocked
                ? "border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                : "border-dashed border-zinc-300 bg-white/40 opacity-60 dark:border-zinc-700 dark:bg-zinc-900/40"
            }`}
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${
                a.unlocked
                  ? "bg-indigo-50 dark:bg-indigo-950"
                  : "bg-zinc-100 grayscale dark:bg-zinc-800"
              }`}
            >
              {a.icon}
            </div>
            <h3 className="mt-3 font-semibold dark:text-zinc-100">{a.title}</h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {a.desc}
            </p>
            <span
              className={`mt-2 inline-block text-xs font-medium ${
                a.unlocked
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-zinc-400 dark:text-zinc-500"
              }`}
            >
              {a.unlocked ? "✅ 已解锁" : "🔒 未解锁"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
