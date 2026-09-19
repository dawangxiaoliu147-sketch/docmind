import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { getChunksByDoc } from "@/lib/vector";
import { Card, Chip, Empty, PageHeader, Stack, buttonClass } from "@/components/ui";

export default async function DocPreviewPage({
  params,
}: {
  params: Promise<{ id: string; docId: string }>;
}) {
  const { id, docId } = await params;
  const user = await requireUser();

  const kb = await prisma.knowledgeBase.findFirst({
    where: { id, userId: user.id },
  });
  if (!kb) notFound();

  const doc = await prisma.document.findFirst({
    where: { id: docId, kbId: id },
  });
  if (!doc) notFound();

  const chunks = await getChunksByDoc(docId);

  return (
    <Stack>
      <Link
        href={`/kb/${id}`}
        className={buttonClass({
          variant: "link",
          className: "self-start text-muted-fg",
        })}
      >
        ← 返回「{kb.name}」
      </Link>

      <PageHeader
        eyebrow="document"
        title={doc.title}
        subtitle={`${doc.fileName} · 共 ${chunks.length} 个知识片段`}
      />

      {chunks.length === 0 ? (
        <Empty icon="≣" title="该文档暂无已处理的片段" />
      ) : (
        <div className="space-y-3">
          {chunks.map((c) => (
            <Card key={c.id} pad>
              <div className="mb-2 flex items-center gap-2">
                <Chip tone="primary" className="num">
                  片段 {c.chunkIndex + 1}
                </Chip>
                <span className="num text-xs text-muted-fg">
                  {c.content.length} 字符
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg2">
                {c.content}
              </p>
            </Card>
          ))}
        </div>
      )}
    </Stack>
  );
}
