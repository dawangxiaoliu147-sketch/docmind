import "server-only";
import { prisma } from "./db";
import { JOBS } from "./jobs";

/**
 * 早期内置的 12 条示例职位的来源标记。
 * 它们**是编的**（`lib/jobs.ts` 第一行自己写着"非真实招聘数据"），
 * 所以只用于"表为空时给个像样的空态"，UI 默认不显示，也不会被同步覆盖。
 */
export const DEMO_SOURCE = "demo";

// 首次访问时灌入示例职位（幂等）。注意：只在表完全为空时发生。
async function ensureSeeded(): Promise<void> {
  const count = await prisma.job.count();
  if (count === 0) {
    await prisma.job.createMany({
      data: JOBS.map((j) => ({
        title: j.title,
        company: j.company,
        location: j.location,
        salary: j.salary,
        tags: j.tags,
        description: j.description,
        requirements: j.requirements,
        source: DEMO_SOURCE,
      })),
    });
  }
}

/**
 * 职位列表。默认**排除示例数据** —— "全真实"的第一步就是别让假职位混在里面。
 * 排序：先按原帖发布时间（新的在前，NULL 排最后），再按入库时间。
 */
export async function getAllJobs(opts: { includeDemo?: boolean } = {}) {
  await ensureSeeded();
  return prisma.job.findMany({
    where: opts.includeDemo ? {} : { source: { not: DEMO_SOURCE } },
    orderBy: [{ postedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
  });
}

export async function getJob(id: string) {
  await ensureSeeded();
  return prisma.job.findUnique({ where: { id } });
}

export async function createJob(data: {
  title: string;
  company: string;
  location: string;
  salary: string;
  tags: string[];
  description: string;
  requirements: string[];
}) {
  return prisma.job.create({ data: { ...data, source: "manual" } });
}

/** 示例数据还有多少条（UI 上用来决定要不要提示"清除"） */
export async function countDemoJobs(): Promise<number> {
  return prisma.job.count({ where: { source: DEMO_SOURCE } });
}

/** 清掉示例数据。只删 source=demo 的行，绝不碰真实抓来的职位 */
export async function deleteDemoJobs(): Promise<number> {
  const r = await prisma.job.deleteMany({ where: { source: DEMO_SOURCE } });
  return r.count;
}

/** 真实（非示例）职位的总数与"可邮件投递"数量 —— 首页/控制台的口径 */
export async function realJobStats(): Promise<{ total: number; email: number }> {
  const [total, email] = await Promise.all([
    prisma.job.count({ where: { source: { not: DEMO_SOURCE } } }),
    prisma.job.count({ where: { source: { not: DEMO_SOURCE }, applyChannel: "email" } }),
  ]);
  return { total, email };
}
