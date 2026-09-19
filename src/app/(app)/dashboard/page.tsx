import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { createKnowledgeBase, deleteKnowledgeBase } from "@/lib/actions/kb";
import { KbCover } from "@/components/kb-cover";
import { GlobalSearch } from "@/components/global-search";
import { buildIsland, activeDaysFrom } from "@/components/island/island-model";
import { KnowledgeIsland } from "@/components/island/knowledge-island";
import { TourButton } from "@/components/onboarding-tour";
import {
  Button,
  Card,
  CardGrid,
  Chip,
  CountUp,
  Empty,
  Field,
  IconBox,
  Input,
  Metric,
  MetricGrid,
  PageHeader,
  Panel,
  Section,
  Stack,
  buttonClass,
} from "@/components/ui";

const FEATURES = [
  { href: "/agent", icon: "✦", name: "智能体", desc: "自主调用工具完成任务" },
  { href: "/workbench", icon: "⊞", name: "工作台", desc: "13 个 AI 工作助手" },
  { href: "/jobs", icon: "⬢", name: "职位库", desc: "职位匹配 · 模拟面试" },
  { href: "/resume", icon: "⊡", name: "简历工坊", desc: "8 套模板 · 智能体改简历" },
  { href: "/achievements", icon: "◆", name: "成就", desc: "查看你的使用成就" },
  { href: "/settings", icon: "⊙", name: "设置", desc: "个性化与 AI 偏好" },
];

export default async function DashboardPage() {
  const user = await requireUser();

  const [kbs, docCount, chunkCount, convCount, resumeCount, jobCount, recent] = await Promise.all([
    prisma.knowledgeBase.findMany({
      where: { userId: user.id },
      include: { _count: { select: { documents: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.document.count({ where: { kb: { userId: user.id } } }),
    prisma.chunk.count({ where: { document: { kb: { userId: user.id } } } }),
    prisma.conversation.count({ where: { userId: user.id } }),
    prisma.resume.count({ where: { userId: user.id } }),
    prisma.job.count(),
    prisma.conversation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { createdAt: true },
    }),
  ]);

  // 最近 7 天活跃几天 → 岛的天气（不纯调用放在模型层）
  const activeDays = activeDaysFrom(recent.map((r) => r.createdAt));

  const islandStats = {
    kb: kbs.length,
    doc: docCount,
    chunk: chunkCount,
    conv: convCount,
    resume: resumeCount,
    job: jobCount,
    activeDays,
    primaryKbId: kbs[0]?.id,
  };
  const island = buildIsland(islandStats);

  return (
    <Stack>
      <PageHeader
        eyebrow="dashboard"
        title="我的知识库"
        subtitle="创建知识库 → 上传文档 → 向 AI 提问，三步构建问答助手。"
        actions={<TourButton tour="kb" />}
      />

      {/* 数据条 */}
      <MetricGrid>
        <Metric icon="◈" label="知识库" value={<CountUp value={kbs.length} />} />
        <Metric icon="≣" label="文档" value={docCount} />
        <Metric icon="⬡" label="知识片段" value={chunkCount} />
      </MetricGrid>

      {/* 知行岛预览：把积累变成看得见的成长 */}
      <Panel className="p-4">
        <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="ui-section-title">知行岛</p>
            <p className="mt-1 text-[12px] text-muted-fg">
              {island.stage} · 已解锁 {island.unlocked} / {island.total} 格
            </p>
          </div>
          <Link href="/island" className={buttonClass({ size: "sm", variant: "outline" })}>
            进入我的岛
          </Link>
        </div>
        <KnowledgeIsland stats={islandStats} compact />
      </Panel>

      {/* 功能总览 */}
      <Section title="功能总览" extra="6 个入口">
        <CardGrid>
          {FEATURES.map((f) => (
            <Link key={f.href} href={f.href} className="block min-w-0">
              <Card hover pad className="h-full">
                <div className="flex items-start gap-3">
                  <IconBox>{f.icon}</IconBox>
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold text-fg">{f.name}</p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-muted-fg">{f.desc}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </CardGrid>
      </Section>

      {/* 跨知识库搜索 */}
      <div data-tour="search-all">
        <GlobalSearch />
      </div>

      {/* 创建知识库 */}
      <Panel className="ui-rail p-5 pl-6" data-tour="create-kb">
        <form action={createKnowledgeBase} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field label="知识库名称" htmlFor="kb-name" className="flex-1" required>
            <Input id="kb-name" name="name" required placeholder="如「公司产品手册」" />
          </Field>
          <Field label="描述" htmlFor="kb-desc" className="flex-1">
            <Input id="kb-desc" name="description" placeholder="描述（可选）" />
          </Field>
          <Button type="submit" pill>
            创建知识库
          </Button>
        </form>
      </Panel>

      {/* 知识库列表 */}
      <Section title="知识库" extra={`${kbs.length} 个`} data-tour="kb-list">
        {kbs.length === 0 ? (
          <Empty
            icon="◈"
            title="还没有知识库"
            desc="在上方输入名称，创建你的第一个知识库；建好后就能直接上传 PDF / Word 向 AI 提问。"
          />
        ) : (
          <CardGrid>
            {kbs.map((kb) => (
              <Card key={kb.id} className="flex flex-col overflow-hidden">
                <Link href={`/kb/${kb.id}`} className="block">
                  <KbCover
                    name={kb.name}
                    coverImage={kb.coverImage}
                    color={kb.color}
                    className="h-32 w-full"
                  />
                </Link>
                <div className="flex flex-1 flex-col p-5">
                  <Link href={`/kb/${kb.id}`} className="flex-1">
                    <p className="text-[13.5px] font-semibold text-fg">{kb.name}</p>
                    <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-[12.5px] leading-relaxed text-muted-fg">
                      {kb.description || "暂无描述"}
                    </p>
                  </Link>
                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
                    <Chip className="num">{kb._count.documents} 个文档</Chip>
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/kb/${kb.id}/chat`}
                        className="btn btn-sm btn-secondary"
                      >
                        提问
                      </Link>
                      <form action={deleteKnowledgeBase}>
                        <input type="hidden" name="id" value={kb.id} />
                        <Button type="submit" variant="ghost" size="sm" className="text-muted-fg">
                          删除
                        </Button>
                      </form>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </CardGrid>
        )}
      </Section>
    </Stack>
  );
}
