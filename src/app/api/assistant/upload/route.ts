import { verifySession } from "@/lib/dal";
import { extractTextFromFile, isSupported } from "@/lib/parse";

const MAX_SIZE = 20 * 1024 * 1024; // 20MB

// 工作台：上传文件并提取文本（供 Agent 分析）
export async function POST(req: Request) {
  const session = await verifySession();
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "请选择文件" }, { status: 400 });
  }
  if (!isSupported(file.type)) {
    return Response.json(
      { error: "仅支持 PDF / Word / Markdown / TXT / HTML / CSV" },
      { status: 400 },
    );
  }
  if (file.size > MAX_SIZE) {
    return Response.json({ error: "文件不能超过 20MB" }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const text = await extractTextFromFile(buffer, file.type);
  if (!text.trim()) {
    return Response.json({ error: "未能从文件中提取到文本" }, { status: 400 });
  }

  return Response.json({
    ok: true,
    fileName: file.name,
    text: text.slice(0, 20000),
  });
}
