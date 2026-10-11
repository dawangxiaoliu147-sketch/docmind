import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
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

  const jobId = typeof body.jobId === "string" ? body.jobId : "";
  if (!jobId) return Response.json({ error: "缺少 jobId" }, { status: 400 });

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
