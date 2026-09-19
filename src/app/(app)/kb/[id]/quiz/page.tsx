import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { QuizPanel } from "@/components/quiz-panel";
import { PageHeader, Stack, buttonClass } from "@/components/ui";

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
    <Stack>
      <Link
        href={`/kb/${id}`}
        className={buttonClass({
          variant: "link",
          className: "self-start text-muted-fg",
        })}
      >
        ← 返回
      </Link>
      <PageHeader eyebrow="quiz" title={`「${kb.name}」知识测验`} />
      <QuizPanel kbId={id} />
    </Stack>
  );
}
