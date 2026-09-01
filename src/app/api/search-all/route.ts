import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";

// 跨知识库搜索：在用户所有知识库中做关键词检索
export async function GET(req: Request) {
  const session = await verifySession();
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  const q = new URL(req.url).searchParams.get("q") ?? "";
  if (!q.trim()) {
    return Response.json({ results: [] });
  }

  const kbs = await prisma.knowledgeBase.findMany({
    where: { userId: session.userId },
    select: { id: true, name: true },
  });
  const kbName = new Map(kbs.map((k) => [k.id, k.name]));

  const chunks = await prisma.chunk.findMany({
    where: {
      kbId: { in: kbs.map((k) => k.id) },
      content: { contains: q, mode: "insensitive" },
    },
    take: 10,
    select: {
      id: true,
      kbId: true,
      docId: true,
      content: true,
      document: { select: { title: true } },
    },
  });

  return Response.json({
    results: chunks.map((c) => ({
      id: c.id,
      kbId: c.kbId,
      docId: c.docId,
      content: c.content.slice(0, 200),
      docTitle: c.document.title,
      kbName: kbName.get(c.kbId) ?? "",
    })),
  });
}
