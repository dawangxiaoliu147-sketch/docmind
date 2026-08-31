import "server-only";
import { splitText } from "./chunk";
import { embedTexts } from "./ai";
import { insertChunk } from "./vector";
import { extractTextFromFile } from "./parse";

// 单个文档的入库流水线：提取文本 → 分块 → 向量化 → 写入 pgvector。
// 返回块数量；任何一步失败都会抛出异常，由调用方把文档标记为 failed。
export async function ingestDocument(opts: {
  docId: string;
  kbId: string;
  buffer: ArrayBuffer;
  mimeType: string;
}): Promise<number> {
  const { docId, kbId, buffer, mimeType } = opts;

  // 1. 提取文本
  const text = await extractTextFromFile(buffer, mimeType);
  if (!text.trim()) {
    throw new Error("未能从文档中提取到文本内容");
  }

  // 2. 分块
  const chunks = splitText(text);
  if (chunks.length === 0) {
    throw new Error("文档内容为空");
  }

  // 3. 向量化（分批，避免一次请求过大）
  const BATCH = 50;
  const embeddings: number[][] = [];
  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH);
    embeddings.push(...(await embedTexts(batch)));
  }

  // 4. 逐块写入数据库
  for (let i = 0; i < chunks.length; i++) {
    await insertChunk({
      id: crypto.randomUUID(),
      docId,
      kbId,
      chunkIndex: i,
      content: chunks[i],
      embedding: embeddings[i],
    });
  }

  return chunks.length;
}
