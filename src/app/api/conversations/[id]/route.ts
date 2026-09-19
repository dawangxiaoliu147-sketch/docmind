import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { revalidatePath } from "next/cache";

// 获取某个对话及其消息
export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const session = await verifySession();
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id, userId: session.userId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) {
    return Response.json({ error: "对话不存在" }, { status: 404 });
  }

  return Response.json({ conversation });
}

// 删除某个对话（级联删除消息）
export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const session = await verifySession();
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id, userId: session.userId },
  });
  if (!conversation) {
    return Response.json({ error: "对话不存在" }, { status: 404 });
  }

  await prisma.conversation.delete({ where: { id } });
  // API 路由不会自动失效页面缓存，小岛与仪表盘要显式声明
  revalidatePath("/dashboard");
  revalidatePath("/island");
  return Response.json({ ok: true });
}
