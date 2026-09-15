import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";

// 简历库：列出 / 新建
export async function GET() {
  const session = await verifySession();
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }
  const resumes = await prisma.resume.findMany({
    where: { userId: session.userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, tpl: true, accent: true, updatedAt: true },
  });
  return Response.json({ resumes });
}

export async function POST(req: Request) {
  const session = await verifySession();
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }
  const body = await req.json();
  const title = String(body?.title ?? "我的简历").trim().slice(0, 60) || "我的简历";
  const html = String(body?.html ?? "").slice(0, 200000);
  const tpl = String(body?.tpl ?? "ribbon");
  const accent = String(body?.accent ?? "#1f4e79");
  if (!html.trim()) {
    return Response.json({ error: "简历内容为空" }, { status: 400 });
  }
  const resume = await prisma.resume.create({
    data: { userId: session.userId, title, html, tpl, accent },
  });
  return Response.json({ id: resume.id });
}
