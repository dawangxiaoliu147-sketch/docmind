import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";

// 列出某知识库下的对话列表
export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const session = await verifySession();
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  const kb = await prisma.knowledgeBase.findFirst({
    where: { id, userId: session.userId },
  });
  if (!kb) {
    return Response.json({ error: "知识库不存在或无权访问" }, { status: 404 });
  }

  const conversations = await prisma.conversation.findMany({
    where: { kbId: id, userId: session.userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true },
  });

  return Response.json({ conversations });
}

// 创建新对话
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const session = await verifySession();
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  const kb = await prisma.knowledgeBase.findFirst({
    where: { id, userId: session.userId },
  });
  if (!kb) {
    return Response.json({ error: "知识库不存在或无权访问" }, { status: 404 });
  }

  const body = await req.json();
  const title = String(body?.title ?? "").trim() || "新对话";

  const conversation = await prisma.conversation.create({
    data: { kbId: id, userId: session.userId, title },
  });

  return Response.json({ conversation });
}
