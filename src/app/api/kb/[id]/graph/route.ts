import { generateText } from "ai";
import { chatModel } from "@/lib/ai";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";

function extractJson(text: string): string {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  const s = text.indexOf("{");
  const e = text.lastIndexOf("}");
  if (s >= 0 && e > s) return text.slice(s, e + 1);
  return text.trim();
}

// 生成知识库的知识图谱（层级结构）
export async function GET(
  _req: Request,
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

  const docs = await prisma.document.findMany({
    where: { kbId: id, status: "ready" },
    select: { id: true, title: true },
    orderBy: { createdAt: "asc" },
  });
  if (docs.length === 0) {
    return Response.json({ topics: [] });
  }

  // 每个文档取前 2 个片段作为样本，控制总量避免过长
  const samples: string[] = [];
  for (const d of docs) {
    const chunks = await prisma.chunk.findMany({
      where: { docId: d.id },
      take: 2,
      select: { content: true },
    });
    samples.push(
      `【文档：${d.title}】\n${chunks.map((c) => c.content.slice(0, 300)).join("\n")}`,
    );
  }
  const material = samples.join("\n\n").slice(0, 6000);

  const result = await generateText({
    model: chatModel,
    system: "你是知识图谱专家，擅长把文档内容整理成层级分明的结构。",
    prompt: `根据下面的文档内容，生成一个知识图谱的层级结构（主题 → 子主题），最多 3 层，主题用简洁的中文短语。\n只返回 JSON，格式：{"topics":[{"name":"主题名","children":[{"name":"子主题名","children":[]}]}]}，不要输出其他内容。\n\n文档内容：\n${material}`,
  });

  try {
    const parsed = JSON.parse(extractJson(result.text));
    return Response.json({ topics: Array.isArray(parsed.topics) ? parsed.topics : [] });
  } catch {
    return Response.json({ error: "生成失败，请重试" }, { status: 500 });
  }
}
