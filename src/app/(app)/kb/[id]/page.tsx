import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { deleteDocument, toggleShare } from "@/lib/actions/kb";
import { UploadForm } from "@/components/upload-form";
import { KbCover } from "@/components/kb-cover";
import { CoverUpload } from "@/components/cover-upload";
import { KbEditForm } from "@/components/kb-edit-form";
import { KbSummary } from "@/components/kb-summary";
import { KbHealth } from "@/components/kb-health";
import { KbGraph } from "@/components/kb-graph";
import { ShareLink } from "@/components/share-link";
import { AiTools } from "@/components/ai-tools";
import {
  Button,
  Chip,
  Empty,
  PageHeader,
  Section,
  Stack,
  buttonClass,
} from "@/components/ui";
import type { ChipTone } from "@/components/ui";

const STATUS_LABEL: Record<string, { text: string; tone: ChipTone }> = {
  processing: { text: "处理中", tone: "muted" },
  ready: { text: "已就绪", tone: "success" },
  failed: { text: "失败", tone: "red" },
};

export default async function KbPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const kb = await prisma.knowledgeBase.findFirst({
    where: { id, userId: user.id },
    include: { documents: { orderBy: { createdAt: "desc" } } },
  });
  if (!kb) notFound();

  return (
    <Stack>
      <Link
        href="/dashboard"
        className={buttonClass({
          variant: "link",
          className: "self-start text-muted-fg",
        })}
      >
        ← 返回
      </Link>

      <KbCover
        name={kb.name}
        coverImage={kb.coverImage}
        color={kb.color}
        className="h-44 w-full rounded-lg"
      />

      <PageHeader
        eyebrow="knowledge base"
        title={kb.name}
        subtitle={kb.description ?? undefined}
        actions={
          <>
            <CoverUpload kbId={kb.id} hasCover={!!kb.coverImage} />
            <Link
              href={`/kb/${kb.id}/quiz`}
              className={buttonClass({ variant: "outline" })}
            >
              ◐ 知识测验
            </Link>
            <Link
              href={`/kb/${kb.id}/chat`}
              className={buttonClass({ pill: true })}
            >
              开始提问
            </Link>
          </>
        }
      />

      {/* 知识库体检：只读扫描全部文档与片段，按需触发（和摘要/图谱同一套折叠区写法） */}
      <details className="card overflow-hidden">
        <summary className="cursor-pointer select-none px-5 py-3 text-sm font-medium text-fg2 transition hover:bg-muted">
          ⊕ 知识库体检（文档与片段健康度）
        </summary>
        <div className="border-t border-border p-5">
          <KbHealth kbId={kb.id} />
        </div>
      </details>

      {/* AI 摘要 */}
      <details className="card overflow-hidden">
        <summary className="cursor-pointer select-none px-5 py-3 text-sm font-medium text-fg2 transition hover:bg-muted">
          AI 摘要
        </summary>
        <div className="border-t border-border p-5">
          <KbSummary kbId={kb.id} />
        </div>
      </details>

      {/* 编辑知识库 */}
      <details className="card overflow-hidden">
        <summary className="cursor-pointer select-none px-5 py-3 text-sm font-medium text-fg2 transition hover:bg-muted">
          编辑知识库
        </summary>
        <div className="border-t border-border p-5">
          <KbEditForm
            kbId={kb.id}
            name={kb.name}
            description={kb.description}
            color={kb.color}
          />
        </div>
      </details>

      {/* AI 知识图谱 */}
      <details className="card overflow-hidden">
        <summary className="cursor-pointer select-none px-5 py-3 text-sm font-medium text-fg2 transition hover:bg-muted">
          ⊛ 知识图谱（AI 自动梳理知识结构）
        </summary>
        <div className="border-t border-border p-5">
          <KbGraph kbId={kb.id} />
        </div>
      </details>

      {/* AI 工具箱 */}
      <details className="card overflow-hidden">
        <summary className="cursor-pointer select-none px-5 py-3 text-sm font-medium text-fg2 transition hover:bg-muted">
          ⊞ AI 工具箱（闪卡 / 闯关 / 学习计划 / 每日一问 / 主题色）
        </summary>
        <div className="border-t border-border p-5">
          <AiTools kbId={kb.id} />
        </div>
      </details>

      {/* 分享知识库 */}
      <details className="card overflow-hidden">
        <summary className="cursor-pointer select-none px-5 py-3 text-sm font-medium text-fg2 transition hover:bg-muted">
          ⧉ 分享知识库（生成只读链接）
        </summary>
        <div className="border-t border-border p-5">
          <form action={toggleShare}>
            <input type="hidden" name="id" value={kb.id} />
            <Button type="submit" variant="secondary">
              {kb.shared ? "停止分享" : "开启分享"}
            </Button>
          </form>
          {kb.shared && (
            <div className="mt-4">
              <p className="mb-2 text-xs text-muted-fg">
                分享链接（任何人打开都能只读查看，无需登录）：
              </p>
              <ShareLink path={`/s/${kb.id}`} />
            </div>
          )}
        </div>
      </details>

      <UploadForm kbId={kb.id} />

      <Section title="文档" extra={`${kb.documents.length} 个`}>
        {kb.documents.length === 0 ? (
          <Empty
            icon="≣"
            title="还没有文档"
            desc="上传一个 PDF / Markdown / TXT 文件开始吧"
          />
        ) : (
          <ul className="card divide-y divide-border overflow-hidden">
            {kb.documents.map((doc) => {
              const status = STATUS_LABEL[doc.status] ?? STATUS_LABEL.processing;
              return (
                <li
                  key={doc.id}
                  className="flex items-center justify-between gap-3 px-5 py-3.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="text-lg" aria-hidden="true">≣</span>
                    <div className="min-w-0">
                      <Link
                        href={`/kb/${kb.id}/docs/${doc.id}`}
                        className="block truncate text-sm font-medium text-fg transition hover:text-primary"
                      >
                        {doc.title}
                      </Link>
                      <p className="truncate text-xs text-muted-fg">
                        {doc.fileName} · {formatSize(doc.size)}
                        {doc.status === "ready" && ` · ${doc.chunkCount} 片段`}
                      </p>
                      {doc.tags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {doc.tags.map((t) => (
                            <Chip key={t} tone="primary">
                              {t}
                            </Chip>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Chip tone={status.tone}>{status.text}</Chip>
                    <form action={deleteDocument}>
                      <input type="hidden" name="docId" value={doc.id} />
                      <input type="hidden" name="kbId" value={kb.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="text-muted-fg"
                      >
                        删除
                      </Button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </Stack>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
