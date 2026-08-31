import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { getChunksByDoc } from "@/lib/vector";

// 获取某个文档的详情 + 它被切分后的所有片段（用于文档预览）
export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string; docId: string }> },
) {
  const { id, docId } = await ctx.params;

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

  const doc = await prisma.document.findFirst({
    where: { id: docId, kbId: id },
  });
  if (!doc) {
    return Response.json({ error: "文档不存在" }, { status: 404 });
  }

  const chunks = await getChunksByDoc(docId);
  return Response.json({ document: doc, chunks });
}
