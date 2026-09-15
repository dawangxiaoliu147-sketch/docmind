import { generateText } from "ai";
import { chatModel } from "@/lib/ai";
import { verifySession } from "@/lib/dal";

// 简历智能体：接收当前简历 HTML + 用户要求，返回修改后的 HTML
export async function POST(req: Request) {
  const session = await verifySession();
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  const body = await req.json();
  const html = String(body?.html ?? "").slice(0, 14000);
  const prompt = String(body?.prompt ?? "").trim();
  if (!prompt) {
    return Response.json({ error: "请输入你的要求" }, { status: 400 });
  }

  const result = await generateText({
    model: chatModel,
    system:
      "你是简历编辑助手。用户会给你一份简历的 HTML 片段和修改要求。请按需求修改 HTML，保持原有的标签结构与 class 名不变，只改内容（也可以增删同结构的条目）。" +
      "只返回修改后的 HTML 片段本身，不要输出解释、不要用 markdown 代码块包裹。",
    prompt: `当前简历 HTML：\n${html}\n\n修改要求：${prompt}`,
  });

  let out = result.text.trim();
  out = out.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/, "").trim();
  if (!out) {
    return Response.json({ error: "修改失败，请重试" }, { status: 500 });
  }
  return Response.json({ html: out });
}
