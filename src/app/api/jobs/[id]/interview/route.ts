import { generateText } from "ai";
import { chatModel } from "@/lib/ai";
import { verifySession } from "@/lib/dal";
import { getJob } from "@/lib/job-store";

// 针对某个职位生成模拟面试题（含参考答案要点）
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  const session = await verifySession();
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }
  const job = await getJob(id);
  if (!job) {
    return Response.json({ error: "职位不存在" }, { status: 404 });
  }

  const result = await generateText({
    model: chatModel,
    system: "你是资深技术面试官，擅长出高质量面试题。",
    prompt: `针对下面这个职位，生成 5 道高频面试题（技术面 + 行为面），每道附参考答案要点。\n只返回 JSON 数组，格式：[{"question":"题目","answer":"参考答案要点"}]，不要输出其他内容。\n\n职位：${job.title}\n公司：${job.company}\n要求：${job.requirements.join("；")}\n标签：${job.tags.join("、")}`,
  });

  try {
    const match = result.text.match(/\[[\s\S]*\]/);
    const parsed = JSON.parse(match?.[0] ?? "[]");
    return Response.json({ questions: Array.isArray(parsed) ? parsed : [] });
  } catch {
    return Response.json({ error: "生成失败，请重试" }, { status: 500 });
  }
}
