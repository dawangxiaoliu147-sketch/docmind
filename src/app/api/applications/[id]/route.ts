import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { isChannel, isStatus, parseTimeline } from "@/lib/application-status";
import { deleteApplication, patchApplication } from "@/lib/applications";

/** 单条投递：改状态/备注/跟进时间，或删除 */
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await verifySession();
  if (!session) return Response.json({ error: "未登录" }, { status: 401 });

  const { id } = await ctx.params;
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "请求体不是合法 JSON" }, { status: 400 });
  }

  const status = isStatus(body.status) ? body.status : undefined;
  const channel = isChannel(body.channel) ? body.channel : undefined;
  const note = typeof body.note === "string" ? body.note : body.note === null ? null : undefined;

  let nextFollowUp: Date | null | undefined;
  if (typeof body.nextFollowUp === "string" && body.nextFollowUp) {
    const d = new Date(body.nextFollowUp);
    nextFollowUp = Number.isNaN(d.getTime()) ? undefined : d;
  } else if (body.nextFollowUp === null) {
    nextFollowUp = null;
  }

  const app = await patchApplication(session.userId, id, { status, channel, note, nextFollowUp });
  if (!app) return Response.json({ error: "记录不存在" }, { status: 404 });

  revalidatePath("/applications");
  revalidatePath("/dashboard");
  return Response.json({ ok: true, application: app, timeline: parseTimeline(app.timeline) });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await verifySession();
  if (!session) return Response.json({ error: "未登录" }, { status: 401 });

  const { id } = await ctx.params;
  const deleted = await deleteApplication(session.userId, id);
  revalidatePath("/applications");
  return Response.json({ ok: true, deleted });
}
