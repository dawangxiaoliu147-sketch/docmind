import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";

// 单份简历：读取 / 更新 / 删除
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const session = await verifySession();
  if (!session) return Response.json({ error: "未登录" }, { status: 401 });

  const resume = await prisma.resume.findFirst({
    where: { id, userId: session.userId },
  });
  if (!resume) return Response.json({ error: "简历不存在" }, { status: 404 });
  return Response.json({ resume });
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const session = await verifySession();
  if (!session) return Response.json({ error: "未登录" }, { status: 401 });

  const existing = await prisma.resume.findFirst({
    where: { id, userId: session.userId },
  });
  if (!existing) return Response.json({ error: "简历不存在" }, { status: 404 });

  const body = await req.json();
  const data: { title?: string; html?: string; tpl?: string; accent?: string } = {};
  if (typeof body?.title === "string") data.title = body.title.trim().slice(0, 60) || existing.title;
  if (typeof body?.html === "string") data.html = body.html.slice(0, 200000);
  if (typeof body?.tpl === "string") data.tpl = body.tpl;
  if (typeof body?.accent === "string") data.accent = body.accent;

  await prisma.resume.update({ where: { id }, data });
  return Response.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const session = await verifySession();
  if (!session) return Response.json({ error: "未登录" }, { status: 401 });

  const existing = await prisma.resume.findFirst({
    where: { id, userId: session.userId },
  });
  if (!existing) return Response.json({ error: "简历不存在" }, { status: 404 });

  await prisma.resume.delete({ where: { id } });
  return Response.json({ ok: true });
}
