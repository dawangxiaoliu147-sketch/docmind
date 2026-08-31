import { generateText } from "ai";
import { chatModel } from "@/lib/ai";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";

// 从 JSON 文本中提取数组（容错处理 markdown 代码块）
function extractJson(text: string): string {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text.trim();
}

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

  const all = await prisma.chunk.findMany({
    where: { kbId: id },
    take: 40,
    select: { content: true },
  });
  if (all.length === 0) {
    return Response.json(
      { error: "该知识库还没有文档内容，先上传文档吧。" },
      { status: 400 },
    );
  }

  // 随机抽 8 个片段作为出题素材
  const shuffled = [...all].sort(() => Math.random() - 0.5).slice(0, 8);
  const material = shuffled.map((c) => c.content).join("\n\n").slice(0, 10000);

  const result = await generateText({
    model: chatModel,
    system: "你是出题老师，善于根据资料出单选题。",
    prompt: `根据下面的资料，生成 5 道单项选择题。要求：
1. 每题 4 个选项，只有 1 个正确答案；
2. 题目考察资料中的关键信息；
3. 用 JSON 数组返回，格式：[{"question":"题目","options":["选项A","选项B","选项C","选项D"],"answer":0,"explanation":"一句话解析"}]
4. answer 是正确选项的索引(0-3)；
5. 只返回 JSON，不要输出其他任何文字。

资料如下：
${material}`,
  });

  let questions: unknown;
  try {
    questions = JSON.parse(extractJson(result.text));
  } catch {
    return Response.json({ error: "出题失败，请重试" }, { status: 500 });
  }

  const valid = (Array.isArray(questions) ? questions : [])
    .filter(
      (q) =>
        q &&
        typeof (q as any).question === "string" &&
        Array.isArray((q as any).options) &&
        (q as any).options.length >= 2 &&
        typeof (q as any).answer === "number" &&
        typeof (q as any).explanation === "string",
    )
    .slice(0, 5);

  if (valid.length === 0) {
    return Response.json({ error: "出题失败，请重试" }, { status: 500 });
  }

  return Response.json({ questions: valid });
}
