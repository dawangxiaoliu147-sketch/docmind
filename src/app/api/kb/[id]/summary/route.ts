import { generateText } from "ai";
import { chatModel } from "@/lib/ai";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";

// 生成知识库内容摘要
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

  const chunks = await prisma.chunk.findMany({
    where: { kbId: id },
    take: 30,
    select: { content: true },
  });
  if (chunks.length === 0) {
    return Response.json({ summary: "该知识库还没有文档内容，先上传文档吧。" });
  }

  const content = chunks
    .map((c) => c.content)
    .join("\n\n")
    .slice(0, 12000);

  const result = await generateText({
    model: chatModel,
    system: "你是知识库助手，请根据给定资料做简洁、准确的总结。",
    prompt: `请用中文总结以下资料的核心内容，分 3~6 点列出，每点一句话：\n\n${content}`,
  });

  return Response.json({ summary: result.text });
}
