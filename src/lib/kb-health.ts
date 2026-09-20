/**
 * 知识库体检：**纯计算**，不碰数据库、不碰 `Date.now()`（时间由调用方传入）。
 *
 * 分三层，理由和快捷键那套一样 —— 规则是「改了要能立刻验证」的部分：
 *   - 本文件：纯规则（可直接用 node 断言）
 *   - `kb-health-data.ts`：取数（Prisma + 原生 SQL）
 *   - `/api/kb/[id]/health`：鉴权与 JSON
 *
 * **不含「覆盖率」（多少文档从未被提问命中）**：检索命中从来没有落库 ——
 * `hybridSearch()` 只在内存里把片段交给模型，`Message` 只存 `content`，
 * 所以现在算不出来。编一个关键词近似值比空着更糟，先不做；
 * 要做就得给检索加命中记录（见 HANDOFF 待办 6）。
 */

export type HealthDocument = {
  id: string;
  title: string;
  /** processing | ready | failed */
  status: string;
  chunkCount: number;
  size: number;
  createdAt: Date;
};

/** 一组内容重复的片段（由 SQL 按「去空白后的正文哈希」分组得到） */
export type DuplicateGroup = {
  hash: string;
  /** 该组里的片段个数 */
  count: number;
  /** 涉及哪些文档（最多 5 个） */
  docIds: string[];
};

export type HealthInput = {
  documents: HealthDocument[];
  duplicates: DuplicateGroup[];
  /** 该知识库的片段总数 */
  chunkTotal: number;
  now: Date;
};

export type HealthFinding = {
  id: string;
  level: "critical" | "warn" | "info";
  title: string;
  detail: string;
  /** 相关文档标题（最多列 5 个） */
  docTitles: string[];
  /** 还有多少份没列出来 */
  moreDocs: number;
};

export type HealthCheck = {
  id: string;
  label: string;
  value: string;
  ok: boolean;
};

export type HealthReport = {
  /** 0–100 */
  score: number;
  grade: string;
  checks: HealthCheck[];
  findings: HealthFinding[];
  suggestions: string[];
  scannedAt: string;
};

/** 扣分权重：一起导出，让界面显示的规则和实际计算用的是同一份数字 */
export const WEIGHTS = {
  failedDoc: 15,
  failedDocMax: 45,
  stuckDoc: 5,
  stuckDocMax: 15,
  emptyDoc: 10,
  emptyDocMax: 30,
  duplicateGroup: 3,
  duplicateGroupMax: 15,
  stale: 10,
  veryStale: 20,
};

/** 超过这个时长还停在「处理中」就算卡住（正常入库是秒级） */
export const STUCK_MS = 30 * 60 * 1000;
export const STALE_DAYS = 180;
export const VERY_STALE_DAYS = 365;
/** 列表里最多列几份文档，其余折叠成「等 N 份」 */
const MAX_LISTED = 5;

const DAY_MS = 24 * 60 * 60 * 1000;

/** 界面直接把这份规则显示出来 —— 免得「页面写的公式」和「代码里的权重」两处漂移 */
export const SCORE_RULES: string[] = [
  `满分 100，从 100 开始扣`,
  `每份解析失败 −${WEIGHTS.failedDoc}（最多 −${WEIGHTS.failedDocMax}）`,
  `每份解析卡住 −${WEIGHTS.stuckDoc}（最多 −${WEIGHTS.stuckDocMax}）`,
  `每份空文档 −${WEIGHTS.emptyDoc}（最多 −${WEIGHTS.emptyDocMax}）`,
  `每组重复片段 −${WEIGHTS.duplicateGroup}（最多 −${WEIGHTS.duplicateGroupMax}）`,
  `最新文档超过 ${STALE_DAYS} 天 −${WEIGHTS.stale}，超过 ${VERY_STALE_DAYS} 天 −${WEIGHTS.veryStale}`,
  `一本文档都没有记 0 分`,
];

export function buildHealthReport(input: HealthInput): HealthReport {
  const { documents, duplicates, chunkTotal, now } = input;
  const ageDays = (d: Date) => Math.floor((now.getTime() - d.getTime()) / DAY_MS);

  const ready = documents.filter((d) => d.status === "ready");
  const processing = documents.filter((d) => d.status === "processing");
  const failed = documents.filter((d) => d.status === "failed");
  // 「解析失败」和「解析卡住」都要能定位到具体文档，否则用户不知道改哪一份
  const stuck = processing.filter((d) => now.getTime() - d.createdAt.getTime() > STUCK_MS);
  const empty = ready.filter((d) => d.chunkCount === 0);
  const stale = documents.filter((d) => ageDays(d.createdAt) > STALE_DAYS);

  const newest = documents.reduce<Date | null>(
    (acc, d) => (acc === null || d.createdAt.getTime() > acc.getTime() ? d.createdAt : acc),
    null,
  );
  const daysSinceNewest = newest === null ? null : ageDays(newest);

  const findings: HealthFinding[] = [];
  const push = (
    id: string,
    level: HealthFinding["level"],
    title: string,
    detail: string,
    docs: HealthDocument[],
  ) => {
    findings.push({
      id,
      level,
      title,
      detail,
      docTitles: docs.slice(0, MAX_LISTED).map((d) => d.title),
      moreDocs: Math.max(0, docs.length - MAX_LISTED),
    });
  };

  if (documents.length === 0) {
    push("empty-kb", "critical", "知识库是空的", "没有任何文档，提问时检索不到任何内容。", []);
  } else {
    if (failed.length > 0) {
      push(
        "failed",
        "critical",
        `${failed.length} 份文档解析失败`,
        "这些文档不会进入检索 —— 等于上传了但用不上。建议改用 PDF / Markdown / TXT 重新上传，或在文档详情页确认入库报错。",
        failed,
      );
    }
    if (stuck.length > 0) {
      push(
        "stuck",
        "warn",
        `${stuck.length} 份文档卡在「处理中」`,
        `超过 ${Math.round(STUCK_MS / 60000)} 分钟仍未完成，通常是入库过程中断了。删除后重新上传即可。`,
        stuck,
      );
    }
    if (empty.length > 0) {
      push(
        "empty",
        "warn",
        `${empty.length} 份文档没有任何片段`,
        "状态是「已就绪」但片段数为 0，检索时永远命中不到。常见原因是文件本身是空的，或扫描件 PDF 没有文字层（需要 OCR）。",
        empty,
      );
    }
    if (duplicates.length > 0) {
      const docCount = new Set(duplicates.flatMap((g) => g.docIds)).size;
      push(
        "duplicates",
        "warn",
        `${duplicates.length} 组重复片段`,
        `涉及 ${docCount} 份文档。重复内容会在检索时挤占有限的名额（每次只召回 4 段），建议删掉重复的那几份。`,
        documents.filter((d) => duplicates.some((g) => g.docIds.includes(d.id))),
      );
    }
    if (daysSinceNewest !== null && daysSinceNewest > STALE_DAYS) {
      push(
        "stale",
        "info",
        `最近一次上传是 ${daysSinceNewest} 天前`,
        `库里有 ${stale.length} 份文档超过 ${STALE_DAYS} 天未更新。资料越旧，回答越容易和现状脱节。`,
        stale,
      );
    }
  }

  // ── 扣分 ─────────────────────────────────────────────
  let score = 100;
  if (documents.length === 0) {
    score = 0;
  } else {
    score -= Math.min(failed.length * WEIGHTS.failedDoc, WEIGHTS.failedDocMax);
    score -= Math.min(stuck.length * WEIGHTS.stuckDoc, WEIGHTS.stuckDocMax);
    score -= Math.min(empty.length * WEIGHTS.emptyDoc, WEIGHTS.emptyDocMax);
    score -= Math.min(duplicates.length * WEIGHTS.duplicateGroup, WEIGHTS.duplicateGroupMax);
    if (daysSinceNewest !== null && daysSinceNewest > VERY_STALE_DAYS) score -= WEIGHTS.veryStale;
    else if (daysSinceNewest !== null && daysSinceNewest > STALE_DAYS) score -= WEIGHTS.stale;
  }
  score = Math.max(0, Math.min(100, Math.round(score)));

  const suggestions: string[] = [];
  if (documents.length === 0) {
    suggestions.push("先上传一份文档 —— 没有内容的库，问什么都是「资料中没有提到」。");
  } else {
    if (failed.length > 0)
      suggestions.push(`优先处理解析失败：${failed.length} 份文档现在完全不参与检索。`);
    if (empty.length > 0)
      suggestions.push(`检查空文档的源文件：${empty.length} 份没有产生任何片段。`);
    if (stuck.length > 0) suggestions.push(`删除卡住的 ${stuck.length} 份文档并重新上传。`);
    if (duplicates.length > 0)
      suggestions.push(`清理重复：${duplicates.length} 组片段内容重复，会让召回结果变单调。`);
    if (daysSinceNewest !== null && daysSinceNewest > STALE_DAYS)
      suggestions.push(`补点新资料：最近一次上传已经是 ${daysSinceNewest} 天前。`);
    if (suggestions.length === 0)
      suggestions.push(
        `状态良好：${ready.length} 份文档、${chunkTotal} 个片段都可用，没有发现需要处理的问题。`,
      );
  }

  const checks: HealthCheck[] = [
    { id: "docs", label: "文档总数", value: `${documents.length}`, ok: documents.length > 0 },
    { id: "ready", label: "已就绪", value: `${ready.length}`, ok: ready.length > 0 },
    { id: "processing", label: "处理中", value: `${processing.length}`, ok: true },
    { id: "failed", label: "解析失败", value: `${failed.length}`, ok: failed.length === 0 },
    { id: "stuck", label: `卡住（>${Math.round(STUCK_MS / 60000)} 分钟）`, value: `${stuck.length}`, ok: stuck.length === 0 },
    { id: "empty", label: "空文档（0 片段）", value: `${empty.length}`, ok: empty.length === 0 },
    { id: "chunks", label: "知识片段", value: `${chunkTotal}`, ok: chunkTotal > 0 },
    { id: "dupes", label: "重复片段组", value: `${duplicates.length}`, ok: duplicates.length === 0 },
    {
      id: "fresh",
      label: "距最近一次上传",
      value: daysSinceNewest === null ? "—" : `${daysSinceNewest} 天`,
      ok: daysSinceNewest !== null && daysSinceNewest <= STALE_DAYS,
    },
    { id: "stale", label: `超过 ${STALE_DAYS} 天未更新`, value: `${stale.length} 份`, ok: stale.length === 0 },
  ];

  return {
    score,
    grade: gradeOf(score, documents.length),
    checks,
    findings,
    suggestions,
    scannedAt: now.toISOString(),
  };
}

function gradeOf(score: number, docCount: number): string {
  if (docCount === 0) return "空库";
  if (score >= 90) return "优秀";
  if (score >= 75) return "良好";
  if (score >= 60) return "需改进";
  return "较差";
}
