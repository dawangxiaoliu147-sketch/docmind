import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { buildIsland, growthScore, activeDaysFrom, type IslandStats } from "@/components/island/island-model";
import { IslandView } from "@/components/island/island-view";
import { TourButton } from "@/components/onboarding-tour";
import {
  Button,
  Chip,
  Metric,
  MetricGrid,
  PageHeader,
  Panel,
  Progress,
  Section,
  Stack,
  buttonClass,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "知行岛 · 知行",
};

export default async function IslandPage() {
  const user = await requireUser();

  const [kb, doc, chunk, conv, resume, job, recentDocs, recentConvs, docList, primaryKb] = await Promise.all([
    prisma.knowledgeBase.count({ where: { userId: user.id } }),
    prisma.document.count({ where: { kb: { userId: user.id } } }),
    prisma.chunk.count({ where: { document: { kb: { userId: user.id } } } }),
    prisma.conversation.count({ where: { userId: user.id } }),
    prisma.resume.count({ where: { userId: user.id } }),
    // 职位库是全局共享的，不按用户过滤
    prisma.job.count(),
    prisma.document.findMany({
      where: { kb: { userId: user.id } },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: { createdAt: true },
    }),
    prisma.conversation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: { createdAt: true },
    }),
    // 地块 ↔ 文档的对应关系：按上传顺序取前 60 份
    prisma.document.findMany({
      where: { kb: { userId: user.id } },
      orderBy: { createdAt: "asc" },
      take: 60,
      select: { title: true, kb: { select: { name: true } } },
    }),
    // 第一个知识库：图书馆要直接进它，而不是笼统跳控制台
    prisma.knowledgeBase.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    }),
  ]);

  const documents = docList.map((d) => ({ title: d.title, kb: d.kb.name }));

  // 最近 7 天里有几天动过 → 决定天气（不纯调用放在模型层，避免 react-hooks/purity）
  const activeDays = activeDaysFrom([...recentDocs, ...recentConvs].map((r) => r.createdAt));

  const stats: IslandStats = {
    kb,
    doc,
    chunk,
    conv,
    resume,
    job,
    activeDays,
    primaryKbId: primaryKb?.id,
  };

  const island = buildIsland(stats);
  const score = growthScore(stats);
  const pct = Math.round((island.unlocked / island.total) * 100);
  const locked = island.buildings.filter((b) => !b.unlocked);
  const next = locked[0];

  return (
    <Stack>
      <PageHeader
        eyebrow="island"
        title="知行岛"
        subtitle="你的知识库、文档、问答、简历、职位 —— 都长在这一座岛上。用得越多，岛越大。"
        actions={
          <>
            <Chip data-tour="island-weather" tone={island.weather === "clear" ? "primary" : "outline"}>
              {island.weather === "clear" ? "晴" : "阴"}
            </Chip>
            <Chip tone="primary">{island.stage}</Chip>
            <TourButton tour="island" />
          </>
        }
      />

      {/* 不套面板：岛直接浮在页面场景背景上（3D 的 Canvas 走 alpha 通道，没有自己的底板） */}
      <div data-tour="island-canvas">
        <IslandView stats={stats} documents={documents} />
      </div>

      <MetricGrid>
        <Metric icon="◈" label="成长分" value={score} />
        <Metric icon="⬡" label="已解锁地块" value={island.unlocked} unit={`/ ${island.total}`} />
        <Metric icon="≣" label="文档" value={doc} />
        <Metric icon="✦" label="对话" value={conv} delta={`近 7 天活跃 ${activeDays} 天`} />
      </MetricGrid>

      <Section title="成长进度" extra={`${pct}%`} data-tour="island-progress">
        <Progress value={pct} label="岛屿解锁进度" />
        <p className="mt-2 text-[12px] leading-relaxed text-muted-fg">
          岛的地块由**成长分**决定：知识库 ×10 / 文档 ×3 / 知识片段 ×0.15 / 对话 ×2 / 简历 ×8。
          分数越高，从中心往外长出的地块越多，地势也越高。
        </p>
      </Section>

      {next ? (
        <Panel className="ui-rail p-5 pl-6">
          <p className="text-[12px] text-muted-fg">下一步就能解锁</p>
          <p className="mt-1 text-[14px] font-semibold text-fg">
            {next.name} —— {next.need}
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted-fg">{next.role}</p>
          <div className="mt-3">
            <Link href={next.href} className={buttonClass({ size: "sm" })}>
              去完成
            </Link>
          </div>
        </Panel>
      ) : null}

      <Section title="岛上有什么" extra={`${island.buildings.length} 处`} data-tour="island-buildings">
        <div className="flex flex-col gap-2">
          {island.buildings.map((b) => (
            <div
              key={b.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3"
            >
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${b.unlocked ? "bg-primary" : "bg-muted-fg"}`}
                aria-hidden="true"
              />
              <span className="text-[13.5px] font-semibold text-fg">{b.name}</span>
              {b.unlocked ? (
                <Chip tone="primary" className="num">
                  {b.stat}
                </Chip>
              ) : (
                <Chip tone="outline">未解锁 · {b.need}</Chip>
              )}
              <span className="min-w-0 flex-1 truncate text-[12.5px] text-muted-fg">{b.role}</span>
              {b.unlocked ? (
                <Link href={b.href} className={buttonClass({ variant: "secondary", size: "sm" })}>
                  去看看
                </Link>
              ) : (
                <Button size="sm" variant="ghost" disabled>
                  未解锁
                </Button>
              )}
            </div>
          ))}
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-muted-fg">
          岛上的建筑点一下就进对应功能：图书馆 = 知识库与问答，灯塔 = 提问，工坊 = 简历，
          码头 = 职位库（全局共享的职位），园圃 = 知识片段，营地 = 文档上传。
        </p>
      </Section>

      <Section title="为什么做这个">
        <Panel className="p-5">
          <ul className="ml-4 list-disc space-y-2 text-[13px] leading-relaxed text-fg2">
            <li>
              **把抽象的积累变成看得见的成长**：知识库、文档、片段在列表里只是数字，在岛上是一座真的会变大、变高的岛。
            </li>
            <li>
              **给首页一个情绪锚点**：每天进来先看到岛比昨天多了一格、天气放晴了 —— 这是持续使用它的理由。
            </li>
            <li>
              **本身就是导航**：六座建筑各自对应一个模块，点建筑就是进功能，不用记路径。
            </li>
            <li>
              **承接成就系统**：建筑解锁的节奏就是里程碑，和「成就」页是同一套语义。
            </li>
          </ul>
          <p className="mt-4 text-[12px] leading-relaxed text-muted-fg">
            天气的含义：最近 7 天里有 3 天以上有活动 → 晴；否则阴。
            岛屿按场景换肤，切到雪境会变成冷色，切到暖云会偏暖 —— 和全站其它部分一致。
          </p>
        </Panel>
      </Section>
    </Stack>
  );
}
