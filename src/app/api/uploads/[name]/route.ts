import { readFile } from "fs/promises";
import path from "path";

// 图片访问接口：从磁盘读取上传的图片并返回。
// 用于解决「Next.js 生产模式下不服务运行时新增的 public 文件」的问题。
const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ name: string }> },
) {
  const { name } = await ctx.params;

  // 防止路径穿越
  if (name.includes("/") || name.includes("\\") || name.includes("..")) {
    return new Response("Not found", { status: 404 });
  }

  const filePath = path.join(process.cwd(), "public", "uploads", name);
  try {
    const buffer = await readFile(filePath);
    const ext = path.extname(name).toLowerCase();
    return new Response(buffer, {
      headers: {
        "Content-Type": TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
