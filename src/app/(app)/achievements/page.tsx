import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { Badge, Card, CardGrid, IconBox, PageHeader, Stack } from "@/components/ui";
import { TourButton } from "@/components/onboarding-tour";

export default async function AchievementsPage() {
  const user = await requireUser();

  const [kbCount, docCount, convCount, chunkCount] = await Promise.all([
    prisma.knowledgeBase.count({ where: { userId: user.id } }),
    prisma.document.count({ where: { kb: { userId: user.id } } }),
    prisma.conversation.count({ where: { kb: { userId: user.id } } }),
    prisma.chunk.count({ where: { document: { kb: { userId: user.id } } } }),
  ]);

  const achievements = [
    { icon: "◈", title: "初建知识库", desc: "创建第一个知识库", unlocked: kbCount >= 1 },
    { icon: "≣", title: "文档收藏家", desc: "上传 5 个文档", unlocked: docCount >= 5 },
    { icon: "◫", title: "文档大师", desc: "上传 20 个文档", unlocked: docCount >= 20 },
    { icon: "⊹", title: "首次提问", desc: "发起第一次对话", unlocked: convCount >= 1 },
    { icon: "✦", title: "提问达人", desc: "发起 10 次对话", unlocked: convCount >= 10 },
    { icon: "⬡", title: "知识渊博", desc: "累计 50 个知识片段", unlocked: chunkCount >= 50 },
  ];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <Stack>
      <PageHeader
        eyebrow="achievements"
        title="成就"
        data-tour="achievements-header"
        subtitle={
          <>
            已解锁 <span className="num">{unlockedCount}</span> /{" "}
            <span className="num">{achievements.length}</span>
          </>
        }
        actions={<TourButton tour="achievements" />}
      />

      <CardGrid data-tour="achievements-grid">
        {achievements.map((a) => (
          <Card
            key={a.title}
            pad
            className={a.unlocked ? undefined : "border-dashed opacity-60"}
          >
            <IconBox size="lg">{a.icon}</IconBox>
            <h3 className="mt-3 font-semibold text-fg">{a.title}</h3>
            <p className="mt-1 text-sm text-muted-fg">{a.desc}</p>
            <div className="mt-2">
              {a.unlocked ? (
                <Badge>已解锁</Badge>
              ) : (
                <Badge muted>— 未解锁</Badge>
              )}
            </div>
          </Card>
        ))}
      </CardGrid>
    </Stack>
  );
}
