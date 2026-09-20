import "server-only";
import { prisma } from "./db";
import { buildHealthReport, type DuplicateGroup, type HealthReport } from "./kb-health";

/** 最多列出多少组重复（扫描的是整库片段，只截取最严重的若干组） */
const MAX_DUPLICATE_GROUPS = 20;

/**
 * 找出内容重复的片段组：按「去掉多余空白后的正文」的 md5 分组，取 count > 1 的。
 *
 * 放在 SQL 里算而不是把片段全捞进 Node：一个库几千个片段，全量传进内存又慢又占带宽，
 * 而 GROUP BY + md5 在数据库里一次就完事。用 `\s+` 归一，是为了让「只差换行/缩进」的
 * 重复也能认出来 —— 直接从 PDF 里抽出来的文本经常在这上面不一样。
 *
 * 注意 `'\\s+'` 里的**双反斜杠**：这是 JS 模板字面量，写成 `'\s+'` 的话 `\s` 不是合法转义，
 * 反斜杠会被吃掉、真正发给 Postgres 的是 `'s+'`（把连续的字母 s 变成空格）——
 * 类型检查和 lint 都发现不了，只会静默算错重复。已验证：见 HANDOFF 坑 28。
 */
async function findDuplicateGroups(kbId: string): Promise<DuplicateGroup[]> {
  const rows = await prisma.$queryRaw<{ hash: string; n: number; docIds: string[] }[]>`
    SELECT
      md5(regexp_replace(btrim("content"), '\\s+', ' ', 'g')) AS "hash",
      count(*)::int AS "n",
      (array_agg(DISTINCT "doc_id"))[1:5] AS "docIds"
    FROM "chunks"
    WHERE "kb_id" = ${kbId}
    GROUP BY 1
    HAVING count(*) > 1
    ORDER BY count(*) DESC
    LIMIT ${MAX_DUPLICATE_GROUPS}
  `;
  // docIds 理论上不会为空（有分组的行至少有 1 个 doc），兜一下以防类型上是 null
  return rows.map((r) => ({ hash: r.hash, count: r.n, docIds: r.docIds ?? [] }));
}

/**
 * 扫一遍知识库，产出体检报告。**只读**：不写库、不调用 AI，所以没有配额限制。
 * `now` 可注入，方便测试里构造「180 天前上传」这类场景。
 */
export async function scanKbHealth(kbId: string, now: Date = new Date()): Promise<HealthReport> {
  const [documents, chunkTotal, duplicates] = await Promise.all([
    prisma.document.findMany({
      where: { kbId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        chunkCount: true,
        size: true,
        createdAt: true,
      },
    }),
    prisma.chunk.count({ where: { kbId } }),
    findDuplicateGroups(kbId),
  ]);

  return buildHealthReport({ documents, duplicates, chunkTotal, now });
}
