import { generateText } from "ai";
import { chatModel } from "@/lib/ai";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";

function extractJson(text: string): string {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  const s = text.indexOf(text.trimStart().startsWith("[") ? "[" : "{");
  const e = text.lastIndexOf(text.trimEnd().endsWith("]") ? "]" : "}");
  if (s >= 0 && e > s) return text.slice(s, e + 1);
  return text.trim();
}

// 取知识库的文档样本（标题 + 前若干片段）
async function getMaterial(kbId: string): Promise<string> {
  const docs = await prisma.document.findMany({
    where: { kbId, status: "ready" },
    select: { id: true, title: true },
    orderBy: { createdAt: "asc" },
    take: 12,
  });
  const samples: string[] = [];
  for (const d of docs) {
    const chunks = await prisma.chunk.findMany({
      where: { docId: d.id },
      take: 3,
      select: { content: true },
    });
    samples.push(`【${d.title}】\n${chunks.map((c) => c.content.slice(0, 250)).join("\n")}`);
  }
  return samples.join("\n\n").slice(0, 8000);
}

// 统一的 AI 生成接口：根据 type 生成不同内容
export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const type = new URL(req.url).searchParams.get("type") ?? "flashcards";

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

  const material = await getMaterial(id);
  if (!material.trim()) {
    return Response.json({ error: "该知识库还没有可用的文档内容" }, { status: 400 });
  }

  const PROMPTS: Record<string, string> = {
    flashcards:
      "生成 8 张学习闪卡（正面是问题/概念，背面是答案/解释）。只返回 JSON 数组，格式：[{\"front\":\"正面\",\"back\":\"背面\"}]，不要输出其他内容。",
    game:
      "生成 5 道知识闯关选择题。只返回 JSON 数组，格式：[{\"question\":\"题目\",\"options\":[\"A选项\",\"B选项\",\"C选项\",\"D选项\"],\"answer\":\"A\",\"explanation\":\"解析\"}]，不要输出其他内容。",
    plan: "根据内容制定一份循序渐进的学习计划，用 Markdown 输出（分阶段、每阶段列学习目标和要点）。",
    daily: "生成一个值得思考的「每日一问」。只返回 JSON，格式：{\"question\":\"问题\",\"hint\":\"提示\"}，不要输出其他内容。",
    theme: "根据内容的主题气质，推荐一个适合这个知识库的主题色（十六进制）。只返回 JSON，格式：{\"color\":\"#4f46e5\",\"reason\":\"一句话理由\"}，不要输出其他内容。",
    recommend:
      "根据内容，推荐 5 个用户可能感兴趣的问题。只返回 JSON 数组，格式：[{\"question\":\"问题\"}]，不要输出其他内容。",
  };

  const prompt = PROMPTS[type] ?? PROMPTS.flashcards;
  const result = await generateText({
    model: chatModel,
    system: "你是知识整理与出题专家。",
    prompt: `${prompt}\n\n知识库内容：\n${material}`,
  });

  // plan 直接返回 markdown，其余解析 JSON
  if (type === "plan") {
    return Response.json({ plan: result.text });
  }

  try {
    const parsed = JSON.parse(extractJson(result.text));
    return Response.json({ data: parsed, type });
  } catch {
    return Response.json({ error: "生成失败，请重试" }, { status: 500 });
  }
}
