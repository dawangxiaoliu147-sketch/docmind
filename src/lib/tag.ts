import "server-only";
import { generateText } from "ai";
import { chatModel } from "./ai";
import { prisma } from "./db";

// 根据文档内容自动生成标签
export async function generateDocTags(docId: string): Promise<string[]> {
  const chunks = await prisma.chunk.findMany({
    where: { docId },
    take: 3,
    orderBy: { chunkIndex: "asc" },
    select: { content: true },
  });
  const text = chunks.map((c) => c.content.slice(0, 300)).join("\n");
  if (!text.trim()) return [];

  const result = await generateText({
    model: chatModel,
    system: "你是文档分类专家。",
    prompt: `给下面的文档内容打 3~5 个简洁的中文标签（主题/关键词）。只返回 JSON 数组，格式：["标签1","标签2"]，不要输出其他内容。\n\n内容：\n${text.slice(0, 2000)}`,
  });

  try {
    const match = result.text.match(/\[[\s\S]*\]/);
    const parsed = JSON.parse(match?.[0] ?? "[]");
    return Array.isArray(parsed) ? parsed.slice(0, 5).map(String) : [];
  } catch {
    return [];
  }
}
