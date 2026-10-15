import { generateText } from "ai";
import { chatModel, visionModel } from "@/lib/ai";
import { verifySession } from "@/lib/dal";
import { aiQuota } from "@/lib/guard";
import { RESUME_STANDARD_PROMPT } from "@/lib/resume-standard";

const TEMPLATES = ["ribbon", "bar", "gray", "underline", "dark", "topbar", "right", "center"];

function extractJson(text: string): string {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  const s = text.indexOf("{");
  const e = text.lastIndexOf("}");
  if (s >= 0 && e > s) return text.slice(s, e + 1);
  return text.trim();
}

// 简历智能体：接收当前简历 HTML + 模板/主题色 + 用户要求，返回修改后的 HTML（可附带模板/主题色变更）
export async function POST(req: Request) {
  const session = await verifySession();
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  const limited = aiQuota(session.userId);
  if (limited) return limited;

  const body = await req.json();
  const html = String(body?.html ?? "").slice(0, 14000);
  const tpl = String(body?.tpl ?? "ribbon");
  const accent = String(body?.accent ?? "#1f4e79");
  const prompt = String(body?.prompt ?? "").trim();
  const source = String(body?.source ?? "").slice(0, 100000);
  const image = typeof body?.image === "string" && body.image.startsWith("data:image") ? body.image : "";
  if (!prompt) {
    return Response.json({ error: "请输入你的要求" }, { status: 400 });
  }

  let result;
  try {
    result = await generateText({
      model: image ? visionModel : chatModel,
      system:
        "你是专业简历编辑助手，帮用户修改简历。用户给你简历的 HTML 片段、当前模板与主题色，以及修改要求。\n" +
        "若用户还上传了「参考资料」（他的经历、旧简历、项目笔记等），你要从中提炼与求职相关的内容，" +
        "按下面的板块规范归纳改写进简历 —— 板块按人的情况挑，不要照搬固定的一套。\n\n" +
        // 简历规范与「规范体检」共用同一份定义（src/lib/resume-standard.ts），
        // 改规范只改那一处，智能体与体检结果不会各说各话。
        RESUME_STANDARD_PROMPT +
        "\n\n【本次任务】\n" +
        "1) 按需求修改 HTML：保持原有标签与 class 结构不变，只改文字内容（可增删同结构的条目）。\n" +
        "2) 若用户要求换模板或换配色，在 tpl / accent 字段给出新值（无要求则原样返回）。\n" +
        `可用模板 tpl：${TEMPLATES.join(" / ")}。\n` +
        "只返回 JSON，格式：{\"html\":\"修改后的HTML片段\",\"tpl\":\"模板id\",\"accent\":\"#十六进制色\"}。" +
        "html 里不要包含 <html>/<body> 外壳，不要用 markdown 代码块包裹整体。",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `当前模板：${tpl}\n当前主题色：${accent}\n\n当前简历 HTML：\n${html}\n${
                source ? `\n参考资料（请从中提炼内容写进简历）：\n${source}\n` : ""
              }${image ? "\n（用户还上传了一张图片，请从中识别并提炼可用于简历的信息）\n" : ""}\n修改要求：${prompt}`,
            },
            ...(image ? [{ type: "image" as const, image }] : []),
          ],
        },
      ],
    });
  } catch (err) {
    // 把供应商的真实报错透出去（常见：上下文超长、密钥无效、余额不足），
    // 否则前端只能看到一句没用的「修改失败」。
    const detail = err instanceof Error ? err.message : String(err);
    return Response.json(
      {
        error:
          `模型调用失败：${detail.slice(0, 300)}` +
          (source.length >= 100000
            ? "\n（参考资料已达上限，可能是上下文超长，请减少上传的文件）"
            : ""),
      },
      { status: 502 },
    );
  }

  let out = result.text.trim();
  out = out.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();

  try {
    const parsed = JSON.parse(extractJson(out));
    const nextHtml = typeof parsed?.html === "string" ? parsed.html : "";
    if (!nextHtml.trim()) return Response.json({ error: "修改失败，请重试" }, { status: 500 });
    const nextTpl = TEMPLATES.includes(parsed?.tpl) ? parsed.tpl : tpl;
    const nextAccent = /^#[0-9a-fA-F]{6}$/.test(parsed?.accent) ? parsed.accent : accent;
    return Response.json({ html: nextHtml, tpl: nextTpl, accent: nextAccent });
  } catch {
    // 兜底：模型直接返回了 HTML
    if (out.startsWith("<")) return Response.json({ html: out, tpl, accent });
    return Response.json({ error: "修改失败，请重试" }, { status: 500 });
  }
}
