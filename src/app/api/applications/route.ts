import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { hashId } from "@/lib/job-text";
import { isChannel, isStatus } from "@/lib/application-status";
import {
  applicationStats,
  dueFollowUps,
  listApplications,
  saveApplication,
} from "@/lib/applications";

/**
 * 投递记录。
 *   GET  → 我的投递列表 + 各状态计数 + 待跟进
 *   POST → 记录/更新一条投递（同一岗位只留一条，重复投是更新状态）
 *
 * 两种入口：
 *   - 给定 jobId（职位库里的岗位详情页）
 *   - 只给 title/company/url（从"找岗位"的结果里直接记一笔，或在别处投的）
 *     这种情况下按 链接+标题 建一条职位记录，幂等 —— 同一条链接点两次不会产生两条。
 */
export async function GET() {
  const session = await verifySession();
  if (!session) return Response.json({ error: "未登录" }, { status: 401 });

  const [items, stats, due] = await Promise.all([
    listApplications(session.userId),
    applicationStats(session.userId),
    dueFollowUps(session.userId),
  ]);

  return Response.json({
    items,
    stats: { total: stats.total, byStatus: Object.fromEntries(stats.byStatus) },
    dueIds: due.map((d) => d.id),
  });
}

export async function POST(req: Request) {
  const session = await verifySession();
  if (!session) return Response.json({ error: "未登录" }, { status: 401 });

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "请求体不是合法 JSON" }, { status: 400 });
  }

  let jobId = typeof body.jobId === "string" ? body.jobId : "";

  if (!jobId) {
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 200) : "";
    const company = typeof body.company === "string" ? body.company.trim().slice(0, 100) : "";
    const url = typeof body.url === "string" && body.url.trim() ? body.url.trim() : null;
    if (!title) {
      return Response.json({ error: "缺少 jobId，或者给一个 title" }, { status: 400 });
    }
    const source = "manual";
    const sourceId = hashId(url || `${title}\u0001${company}`);
    const exist = await prisma.job.findUnique({
      where: { source_sourceId: { source, sourceId } },
      select: { id: true },
    });
    const job =
      exist ??
      (await prisma.job.create({
        data: {
          title,
          company: company || "未注明公司",
          location: "",
          salary: "",
          description: title,
          requirements: [],
          tags: [],
          url,
          source,
          sourceId,
        },
      }));
    jobId = job.id;
  }

  const channel = isChannel(body.channel) ? body.channel : undefined;
  const status = isStatus(body.status) ? body.status : undefined;
  const note = typeof body.note === "string" ? body.note : body.note === null ? null : undefined;
  const resumeId =
    typeof body.resumeId === "string" ? body.resumeId : body.resumeId === null ? null : undefined;

  let nextFollowUp: Date | null | undefined;
  if (typeof body.nextFollowUp === "string" && body.nextFollowUp) {
    const d = new Date(body.nextFollowUp);
    nextFollowUp = Number.isNaN(d.getTime()) ? undefined : d;
  } else if (body.nextFollowUp === null) {
    nextFollowUp = null;
  }

  const app = await saveApplication(session.userId, {
    jobId,
    channel,
    status,
    note,
    resumeId,
    nextFollowUp,
  });

  revalidatePath("/applications");
  revalidatePath("/jobs");
  revalidatePath("/dashboard");

  return Response.json({ ok: true, application: app });
}
