import "server-only";
import { prisma } from "./db";
import { classifyApply } from "./job-contact";
import { JOB_SOURCES, getSource, listSources, type JobSource, type RawJob } from "./job-sources";

/**
 * 职位同步：从已启用的源抓真实职位 → 归一化 → 按 (source, sourceId) 去重入库。
 *
 * 几个刻意的设计：
 *   - **逐源隔离**：一个源挂了只记它自己失败，不影响别的源（返回结果里能看到具体错误）。
 *   - **不物理删除**：源里下架的帖子只是不再更新，历史记录留着（将来投递记录要引用它）。
 *   - **可溯源**：每条都存 url / postedAt / fetchedAt / apply*，界面上能点回原帖核对。
 *   - **默认只跑 enabledByDefault 的源**：自定义 RSS 源没配置就什么都不抓。
 */

export type SyncSourceResult = {
  source: string;
  name: string;
  ok: boolean;
  fetched: number;
  created: number;
  updated: number;
  /** 本轮里"能直接邮件投递"的条数 —— 这是最该关注的数字 */
  withEmail: number;
  ms: number;
  error?: string;
};

/** 投递相关字段（从正文抽出来的那部分）+ 是否可直接邮件投递 */
function toApplyFields(j: RawJob) {
  const apply = classifyApply(j.contactText);
  return {
    isEmail: apply.channel === "email",
    fields: {
      applyChannel: apply.channel,
      applyEmail: apply.email,
      applyUrl: apply.url,
      contact: apply.contact,
    },
  };
}

export async function syncJobs(sourceIds?: string[], limit = 50): Promise<SyncSourceResult[]> {
  const picked: JobSource[] =
    sourceIds && sourceIds.length > 0
      ? (sourceIds.map(getSource).filter(Boolean) as JobSource[])
      : JOB_SOURCES.filter((s) => s.enabledByDefault);

  const results: SyncSourceResult[] = [];

  for (const src of picked) {
    const t0 = Date.now();
    try {
      const raw = await src.fetch(limit);
      let created = 0;
      let updated = 0;
      let withEmail = 0;

      for (const j of raw) {
        const { isEmail, fields } = toApplyFields(j);
        if (isEmail) withEmail++;

        const data = {
          title: j.title,
          company: j.company,
          location: j.location,
          salary: j.salary,
          description: j.description,
          requirements: j.requirements,
          tags: j.tags,
          url: j.url,
          postedAt: j.postedAt,
          fetchedAt: new Date(),
          active: true,
          ...fields,
        };

        const exist = await prisma.job.findUnique({
          where: { source_sourceId: { source: j.source, sourceId: j.sourceId } },
          select: { id: true },
        });
        if (exist) {
          await prisma.job.update({ where: { id: exist.id }, data });
          updated++;
        } else {
          await prisma.job.create({ data: { ...data, source: j.source, sourceId: j.sourceId } });
          created++;
        }
      }

      results.push({
        source: src.id,
        name: src.name,
        ok: true,
        fetched: raw.length,
        created,
        updated,
        withEmail,
        ms: Date.now() - t0,
      });
    } catch (e) {
      results.push({
        source: src.id,
        name: src.name,
        ok: false,
        fetched: 0,
        created: 0,
        updated: 0,
        withEmail: 0,
        ms: Date.now() - t0,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return results;
}

export type SourceStat = {
  source: string;
  total: number;
  active: number;
  email: number;
  lastFetchedAt: string | null;
};

/** 界面用：每个源现在有多少条、多少条能邮件投递、最后一次抓取时间 */
export async function sourceStats(): Promise<SourceStat[]> {
  const grouped = await prisma.job.groupBy({
    by: ["source"],
    _count: { _all: true },
    _max: { fetchedAt: true },
  });
  const emailGroups = await prisma.job.groupBy({
    by: ["source"],
    where: { applyChannel: "email" },
    _count: { _all: true },
  });
  const activeGroups = await prisma.job.groupBy({
    by: ["source"],
    where: { active: true },
    _count: { _all: true },
  });
  const emailMap = new Map(emailGroups.map((g) => [g.source, g._count._all]));
  const activeMap = new Map(activeGroups.map((g) => [g.source, g._count._all]));

  return grouped
    .map((g) => ({
      source: g.source,
      total: g._count._all,
      active: activeMap.get(g.source) ?? 0,
      email: emailMap.get(g.source) ?? 0,
      lastFetchedAt: g._max.fetchedAt ? g._max.fetchedAt.toISOString() : null,
    }))
    .sort((a, b) => b.total - a.total);
}

export { listSources };
