import { generateText } from "ai";
import { chatModel } from "@/lib/ai";
import { verifySession } from "@/lib/dal";
import { isSupported, extractTextFromFile } from "@/lib/parse";
import { getAllJobs } from "@/lib/job-store";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function extractJson(text: string): string {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text.trim();
}

// 根据简历推荐最匹配的职位
export async function POST(req: Request) {
  const session = await verifySession();
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 });
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

  const jobs = await getAllJobs();
  const jobList = jobs
    .map(
      (j) =>
        `- id: ${j.id}, 职位: ${j.title}, 公司: ${j.company}, 标签: ${j.tags.join("/")}, 要求: ${j.requirements.join("；")}`,
    )
    .join("\n");

  const result = await generateText({
    model: chatModel,
    system: "你是资深 HR 和技术招聘专家，擅长人岗匹配。",
    prompt: `根据候选人的简历，从下面的职位列表中选出最匹配的 3 个职位。\n只返回 JSON 数组，格式：[{"id":"职位id","reason":"推荐理由(一句话)"}]，不要输出其他内容。\n\n职位列表：\n${jobList}\n\n候选人的简历：\n${resume.slice(0, 10000)}`,
  });

  let picked: Array<{ id: string; reason: string }> = [];
  try {
    picked = JSON.parse(extractJson(result.text));
  } catch {
    return Response.json({ error: "分析失败，请重试" }, { status: 500 });
  }

  const matches = picked
    .map((p) => {
      const job = jobs.find((j) => j.id === p.id);
      return job ? { job, reason: p.reason } : null;
    })
    .filter(Boolean);

  return Response.json({ matches });
}
