import "server-only";
import { prisma } from "./db";
import {
  APPLIED_STATUSES,
  appendTimeline,
  type AppStatus,
  type Channel,
} from "./application-status";

/**
 * 投递记录的数据库操作。状态/渠道常量与时间线工具在 `application-status.ts`（纯模块，
 * 客户端也要用标签），这里只放需要 Prisma 的部分。
 *
 * 定位：平台上的"点提交"由你完成；本模块负责**记录、提醒与复盘**，不托管你的平台账号。
 */

export async function listApplications(userId: string) {
  return prisma.application.findMany({
    where: { userId },
    include: { job: true },
    orderBy: [{ nextFollowUp: { sort: "asc", nulls: "last" } }, { updatedAt: "desc" }],
  });
}

export async function getApplicationForJob(userId: string, jobId: string) {
  return prisma.application.findUnique({
    where: { userId_jobId: { userId, jobId } },
  });
}

export async function applicationStats(userId: string) {
  const rows = await prisma.application.groupBy({
    by: ["status"],
    where: { userId },
    _count: { _all: true },
  });
  const byStatus = new Map(rows.map((r) => [r.status, r._count._all]));
  const total = rows.reduce((n, r) => n + r._count._all, 0);
  const interviewed = (byStatus.get("interview") ?? 0) + (byStatus.get("offer") ?? 0);
  return { total, byStatus, interviewed };
}

/** 该跟进的：nextFollowUp 已到或已过期 */
export async function dueFollowUps(userId: string, now = new Date()) {
  return prisma.application.findMany({
    where: { userId, nextFollowUp: { not: null, lte: now } },
    include: { job: true },
    orderBy: { nextFollowUp: "asc" },
  });
}

/** 记录/更新一条投递（同一岗位只留一条；重复"投递"其实是更新状态） */
export async function saveApplication(
  userId: string,
  input: {
    jobId: string;
    channel?: Channel;
    status?: AppStatus;
    resumeId?: string | null;
    note?: string | null;
    nextFollowUp?: Date | null;
  },
) {
  const exist = await getApplicationForJob(userId, input.jobId);
  const status: AppStatus = input.status ?? (exist?.status as AppStatus) ?? "sent";
  const now = new Date();

  // 首次进入"已投递及之后"的状态时记 appliedAt
  const appliedAt =
    exist?.appliedAt ?? (APPLIED_STATUSES.includes(status) ? now : null);

  const timeline = appendTimeline(exist?.timeline, {
    at: now.toISOString(),
    from: exist?.status,
    to: status,
    note: input.note ?? undefined,
  });

  const data = {
    channel: input.channel ?? exist?.channel ?? "other",
    status,
    resumeId: input.resumeId === undefined ? (exist?.resumeId ?? null) : input.resumeId,
    note: input.note === undefined ? (exist?.note ?? null) : input.note,
    nextFollowUp:
      input.nextFollowUp === undefined ? (exist?.nextFollowUp ?? null) : input.nextFollowUp,
    appliedAt,
    timeline,
  };

  if (exist) {
    return prisma.application.update({ where: { id: exist.id }, data });
  }
  return prisma.application.create({ data: { ...data, userId, jobId: input.jobId } });
}

/** 更新状态/备注/跟进时间（只改传进来的字段） */
export async function patchApplication(
  userId: string,
  id: string,
  patch: { status?: AppStatus; note?: string | null; nextFollowUp?: Date | null; channel?: Channel },
) {
  const exist = await prisma.application.findFirst({ where: { id, userId } });
  if (!exist) return null;

  const now = new Date();
  const status = (patch.status ?? exist.status) as AppStatus;
  const timeline =
    patch.status && patch.status !== exist.status
      ? appendTimeline(exist.timeline, { at: now.toISOString(), from: exist.status, to: status })
      : exist.timeline;

  return prisma.application.update({
    where: { id: exist.id },
    data: {
      status,
      timeline,
      ...(patch.note === undefined ? {} : { note: patch.note }),
      ...(patch.nextFollowUp === undefined ? {} : { nextFollowUp: patch.nextFollowUp }),
      ...(patch.channel === undefined ? {} : { channel: patch.channel }),
      ...(exist.appliedAt === null && APPLIED_STATUSES.includes(status) ? { appliedAt: now } : {}),
    },
  });
}

export async function deleteApplication(userId: string, id: string) {
  const exist = await prisma.application.findFirst({ where: { id, userId }, select: { id: true } });
  if (!exist) return 0;
  await prisma.application.delete({ where: { id: exist.id } });
  return 1;
}

/** 一段时间内的投递数（看板上的"本周投了多少"） */
export async function appliedSince(userId: string, since: Date) {
  return prisma.application.count({
    where: { userId, appliedAt: { gte: since } },
  });
}

/**
 * 近 7 天投递数。
 * 把 `Date.now()` 收在库里：页面在**渲染期**直接调它会被 `react-hooks/purity` 拦下
 * （项目里岛页当初也是这么绕的：不纯调用放模型层）。
 */
export async function appliedLastWeek(userId: string) {
  return appliedSince(userId, new Date(Date.now() - 7 * 86400000));
}
