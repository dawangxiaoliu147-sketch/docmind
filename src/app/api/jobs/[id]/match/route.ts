import { generateText } from "ai";
import { chatModel } from "@/lib/ai";
import { verifySession } from "@/lib/dal";
import { isSupported, extractTextFromFile } from "@/lib/parse";
import { getJob } from "@/lib/jobs";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

// 分析简历与某个职位的匹配度
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  const session = await verifySession();
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  const job = getJob(id);
  if (!job) {
    return Response.json({ error: "职位不存在" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "请上传简历文件" }, { status: 400 });
  }
  if (!isSupported(file.type)) {
    return Response.json(
      { error: "仅支持 PDF / Word / Markdown / TXT / HTML / CSV" },
      { status: 400 },
    );
  }
  if (file.size > MAX_SIZE) {
    return Response.json({ error: "文件不能超过 10MB" }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const resume = await extractTextFromFile(buffer, file.type);
  if (!resume.trim()) {
    return Response.json({ error: "未能从简历中提取到文本" }, { status: 400 });
  }

  const result = await generateText({
    model: chatModel,
    system: "你是资深 HR 和技术面试官，擅长做简历与职位的匹配度分析。",
    prompt: `请分析候选人的简历与下面职位的匹配度，用 Markdown 输出：\n\n## 匹配度\n给出一个百分比和一句话总评\n\n## 匹配的优势\n分点列出\n\n## 存在的差距\n分点列出\n\n## 改进建议\n分点列出（具体可操作）\n\n职位信息：\n- 职位：${job.title}\n- 公司：${job.company}\n- 要求：${job.requirements.join("；")}\n- 标签：${job.tags.join("、")}\n\n候选人简历：\n${resume.slice(0, 10000)}`,
  });

  return Response.json({ analysis: result.text, job });
}
