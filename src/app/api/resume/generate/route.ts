import { generateText } from "ai";
import { chatModel } from "@/lib/ai";
import { verifySession } from "@/lib/dal";

function extractJson(text: string): string {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  const s = text.indexOf("{");
  const e = text.lastIndexOf("}");
  if (s >= 0 && e > s) return text.slice(s, e + 1);
  return text.trim();
}

// 根据用户信息生成结构化简历数据（供前端渲染精美简历）
export async function POST(req: Request) {
  const session = await verifySession();
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  const body = await req.json();
  const name = String(body?.name ?? "").trim();
  const target = String(body?.target ?? "").trim();
  const info = String(body?.info ?? "").trim();

  if (!name || !target) {
    return Response.json({ error: "姓名和目标岗位为必填项" }, { status: 400 });
  }

  const result = await generateText({
    model: chatModel,
    system: "你是资深简历专家，擅长把零散信息改写成专业、有量化成果的简历。",
    prompt: `根据下面的信息，生成的简历用标准的「教育背景 / 实习经历 / 项目经历 / 证书技能 / 个人优势」结构，中文、沉稳专业、量化成果。\n只返回 JSON，格式如下（字段名必须完全一致）：\n{"name":"姓名","contact":{"age":"年龄","city":"城市","phone":"电话","email":"邮箱"},"education":[{"school":"学校","major":"专业","degree":"学历","time":"时间段"}],"experience":[{"company":"公司","role":"岗位","time":"时间段","points":["**要点（如供应链搭建）：** 具体描述（量化成果）"]}],"projects":[{"name":"项目名","role":"角色","time":"时间段","points":["**要点：** 具体描述"]}],"skills":[{"name":"技能类别","detail":"具体技能描述"}],"strengths":["个人优势1（量化）","个人优势2","个人优势3"]}\n\n姓名：${name}\n目标岗位：${target}\n其他信息：\n${info.slice(0, 4000) || "（信息较少，请根据目标岗位合理生成示例内容，并用【】标注需要用户替换的地方）"}`,
  });

  try {
    const parsed = JSON.parse(extractJson(result.text));
    return Response.json({ resume: parsed });
  } catch {
    return Response.json({ error: "生成失败，请重试" }, { status: 500 });
  }
}
