import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, Chip, Empty, IconBox, ScenicBackdrop, buttonClass } from "@/components/ui";

// 公开分享页：无需登录，只读展示知识库的文档概览
export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const kb = await prisma.knowledgeBase.findFirst({
    where: { id, shared: true },
    include: {
      documents: {
        where: { status: "ready" },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!kb) notFound();

  // 每个文档取第一个片段作为预览
  const docs = await Promise.all(
    kb.documents.map(async (d) => {
      const first = await prisma.chunk.findFirst({
        where: { docId: d.id },
        orderBy: { chunkIndex: "asc" },
        select: { content: true },
      });
      return { ...d, preview: first?.content.slice(0, 200) ?? "" };
    }),
  );

  return (
    <div className="ui-shell has-scenic ui-scene-fade min-h-screen">
      <ScenicBackdrop veil="strong" />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="ui-eyebrow">shared knowledge base</p>
        <h1 className="ui-title">{kb.name}</h1>
        {kb.description && <p className="ui-subtitle">{kb.description}</p>}

        <div className="mt-8">
          <h2 className="ui-section-title mb-3">文档（{docs.length}）</h2>
          {docs.length === 0 ? (
            <Empty icon="◈" title="该知识库暂无已就绪的文档" />
          ) : (
            <div className="flex flex-col gap-4">
              {docs.map((d) => (
                <Card key={d.id} pad>
                  <div className="flex items-start gap-3">
                    <IconBox size="sm">≣</IconBox>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-[13.5px] font-semibold text-fg">{d.title}</h3>
                        <Chip className="num">{d.chunkCount} 个片段</Chip>
                      </div>
                      {d.preview && (
                        <p className="mt-3 whitespace-pre-wrap text-[12.5px] leading-relaxed text-muted-fg">
                          {d.preview}…
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center">
          <p className="text-[11.5px] text-muted-fg">由 知行 提供 · 基于 RAG 的 AI 智能知识库</p>
          <Link href="/" className={buttonClass({ variant: "link", className: "mt-2" })}>
            我也要创建自己的知识库 →
          </Link>
        </div>
      </div>
    </div>
  );
}
