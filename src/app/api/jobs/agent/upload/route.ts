import { verifySession } from "@/lib/dal";
import { uploadQuota } from "@/lib/guard";
import { extractTextFromFile, isSupported, mimeFromFileName } from "@/lib/parse";

/**
 * 上传简历附件，只把文字读出来给"找岗位"用。
 *
 * 几个刻意的点：
 *   - **不落盘**：文件不写服务器磁盘，读完文字就丢（简历是敏感资料，没必要存）。
 *   - 复用 `lib/parse.ts`：PDF 走 unpdf、Word 走 mammoth，和知识库上传同一套解析。
 *   - 老式 .doc 不支持（mammoth 只吃 .docx）—— 明确提示存成 .docx 或 PDF，而不是抛个看不懂的错。
 *   - 过 `uploadQuota`：和知识库上传共用配额，防止有人拿它刷磁盘/CPU。
 */

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB，简历远够
const MAX_CHARS = 20000; // 回给前端的上限，AI 那边本来也只取前 3000 字

export async function POST(req: Request) {
  const session = await verifySession();
  if (!session) return Response.json({ error: "未登录" }, { status: 401 });

  const limited = uploadQuota(session.userId);
  if (limited) return limited;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "请求格式不对（需要 multipart/form-data）" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "没有收到文件" }, { status: 400 });
  }
  if (file.size === 0) {
    return Response.json({ error: "文件是空的" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: `文件太大，上限 ${MAX_BYTES / 1024 / 1024}MB` }, { status: 400 });
  }

  const name = file.name || "resume";
  if (name.toLowerCase().endsWith(".doc")) {
    return Response.json(
      { error: "老式 .doc 读不了，请另存为 .docx 或 PDF" },
      { status: 400 },
    );
  }

  // 浏览器给的 type 有时是空的（.md/.docx 常见），按扩展名兜底
  const mimeType = file.type || mimeFromFileName(name);
  if (!isSupported(mimeType)) {
    return Response.json(
      { error: "只支持 PDF、Word(.docx)、txt、md、html" },
      { status: 400 },
    );
  }

  try {
    const raw = await extractTextFromFile(await file.arrayBuffer(), mimeType);
    const text = raw.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

    if (text.length < 20) {
      return Response.json(
        { error: "这份文件里没读出多少文字。如果是扫描件/纯图片 PDF，需要先转成可选中文字的版本。" },
        { status: 400 },
      );
    }

    return Response.json({
      ok: true,
      fileName: name,
      chars: text.length,
      truncated: text.length > MAX_CHARS,
      text: text.slice(0, MAX_CHARS),
    });
  } catch (e) {
    return Response.json(
      { error: `解析失败：${e instanceof Error ? e.message : String(e)}` },
      { status: 400 },
    );
  }
}
