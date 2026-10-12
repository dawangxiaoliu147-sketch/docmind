import "server-only";
import { extractText } from "unpdf";
import mammoth from "mammoth";

// 支持的文档类型
export const SUPPORTED_MIME = [
  "text/plain",
  "text/markdown",
  "text/x-markdown",
  "text/csv",
  "text/html",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
] as const;

export function isSupported(mimeType: string): boolean {
  return (SUPPORTED_MIME as readonly string[]).includes(mimeType);
}

/**
 * 按文件名猜 MIME。
 * 为什么需要：浏览器对 .md / .docx 有时给空 type，只看 file.type 会被误判成"不支持"。
 */
export function mimeFromFileName(fileName: string): string {
  const name = fileName.toLowerCase();
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (name.endsWith(".md") || name.endsWith(".markdown")) return "text/markdown";
  if (name.endsWith(".html") || name.endsWith(".htm")) return "text/html";
  if (name.endsWith(".csv")) return "text/csv";
  if (name.endsWith(".txt")) return "text/plain";
  return "";
}

export function getExtension(mimeType: string): string {
  switch (mimeType) {
    case "application/pdf":
      return "pdf";
    case "text/markdown":
    case "text/x-markdown":
      return "md";
    case "text/html":
      return "html";
    case "text/csv":
      return "csv";
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return "docx";
    default:
      return "txt";
  }
}

// 清理文本：移除 PostgreSQL 无法存储的 NUL 字节（0x00）。
function sanitizeText(text: string): string {
  return text.replace(/\u0000/g, "");
}

// 简单 HTML → 纯文本
function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// 从文件二进制内容提取纯文本
export async function extractTextFromFile(
  buffer: ArrayBuffer,
  mimeType: string,
): Promise<string> {
  // PDF
  if (mimeType === "application/pdf") {
    const { text } = await extractText(new Uint8Array(buffer), {
      mergePages: true,
    });
    return sanitizeText(text);
  }

  // Word (.docx)
  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({
      buffer: Buffer.from(buffer),
    });
    return sanitizeText(result.value);
  }

  // HTML
  if (mimeType === "text/html") {
    const decoder = new TextDecoder("utf-8");
    return sanitizeText(stripHtml(decoder.decode(buffer)));
  }

  // txt / md / csv 等文本文件直接按 UTF-8 解码
  const decoder = new TextDecoder("utf-8");
  return sanitizeText(decoder.decode(buffer));
}
