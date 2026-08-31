import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { embedText } from "@/lib/ai";
import { searchChunks } from "@/lib/vector";

// 语义检索接口：给定问题，返回知识库中最相关的片段（用于「参考来源」展示）
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

  const q = new URL(req.url).searchParams.get("q") ?? "";
  if (!q.trim()) {
    return Response.json({ chunks: [] });
  }

  const embedding = await embedText(q);
  const chunks = await searchChunks(id, embedding, 4);
  return Response.json({ chunks });
}
