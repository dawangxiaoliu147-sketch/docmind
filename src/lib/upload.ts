import "server-only";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

// 图片上传工具：保存到 public/uploads，返回可访问的 URL 路径。

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function isImage(file: File): boolean {
  return file.type in EXT_BY_TYPE;
}

export function imageSizeOk(file: File): boolean {
  return file.size <= MAX_IMAGE_SIZE;
}

// 保存图片，返回类似 /uploads/xxx.jpg 的路径
export async function saveImage(file: File): Promise<string> {
  const ext = EXT_BY_TYPE[file.type];
  const name = `${crypto.randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, name), buffer);
  return `/uploads/${name}`;
}
