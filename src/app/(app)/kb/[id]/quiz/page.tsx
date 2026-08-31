import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { QuizPanel } from "@/components/quiz-panel";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const kb = await prisma.knowledgeBase.findFirst({
    where: { id, userId: user.id },
  });
  if (!kb) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/kb/${id}`}
          className="text-sm text-zinc-500 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← 返回
        </Link>
        <h1 className="text-xl font-semibold dark:text-zinc-50">
          「{kb.name}」知识测验
        </h1>
      </div>
      <QuizPanel kbId={id} />
    </div>
  );
}
