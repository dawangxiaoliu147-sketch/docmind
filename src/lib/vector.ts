import "server-only";
import { prisma } from "./db";

// pgvector 的 vector 类型无法通过 Prisma 常规 API 读写，
// 这里用原生 SQL 完成向量入库与相似度检索。

function toVectorLiteral(vec: number[]): string {
  return `[${vec.join(",")}]`;
}

export interface ChunkRow {
  id: string;
  docId: string;
  content: string;
  similarity: number;
}

// 插入一个带向量的文本块
export async function insertChunk(opts: {
  id: string;
  docId: string;
  kbId: string;
  chunkIndex: number;
  content: string;
  embedding: number[];
}): Promise<void> {
  const vectorLiteral = toVectorLiteral(opts.embedding);

  await prisma.$executeRaw`
    INSERT INTO "chunks" ("id", "doc_id", "kb_id", "chunk_index", "content", "embedding", "created_at")
    VALUES (${opts.id}, ${opts.docId}, ${opts.kbId}, ${opts.chunkIndex}, ${opts.content}, ${vectorLiteral}::vector, NOW())
  `;
}

// 语义检索：按余弦距离找出与 query 最相似的 topK 个块
// pgvector 的 <=> 是余弦距离，1 - 距离 即余弦相似度（越接近 1 越相似）
export async function searchChunks(
  kbId: string,
  embedding: number[],
  topK: number = 4,
): Promise<ChunkRow[]> {
  const vectorLiteral = toVectorLiteral(embedding);

  return prisma.$queryRaw<ChunkRow[]>`
    SELECT
      "id",
      "doc_id" AS "docId",
      "content",
      1 - ("embedding" <=> ${vectorLiteral}::vector) AS "similarity"
    FROM "chunks"
    WHERE "kb_id" = ${kbId}
    ORDER BY "embedding" <=> ${vectorLiteral}::vector
    LIMIT ${topK}
  `;
}

// 删除某个文档的所有 chunk（先删 chunk 再删 document）
export async function deleteChunksByDoc(docId: string): Promise<void> {
  await prisma.chunk.deleteMany({ where: { docId } });
}

// 统计知识库下的 chunk 数量
export async function countChunks(kbId: string): Promise<number> {
  return prisma.chunk.count({ where: { kbId } });
}

// 查询某个文档的全部片段（按顺序），用于文档预览
export async function getChunksByDoc(docId: string) {
  return prisma.chunk.findMany({
    where: { docId },
    orderBy: { chunkIndex: "asc" },
    select: { id: true, chunkIndex: true, content: true },
  });
}
