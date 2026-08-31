// 文本分块器：把长文档切成适合向量化/检索的片段。
// 采用「定长 + 重叠 + 尽量在句末/换行处断开」的简单策略，
// 重叠是为了避免一句话被从中间切断，丢失上下文。

const DEFAULT_CHUNK_SIZE = 800; // 每块约 800 字符
const DEFAULT_OVERLAP = 120; // 相邻块重叠 120 字符

export function splitText(
  text: string,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
  overlap: number = DEFAULT_OVERLAP,
): string[] {
  const clean = text.replace(/\r\n/g, "\n").trim();
  if (!clean) return [];
  if (clean.length <= chunkSize) return [clean];

  const chunks: string[] = [];
  let start = 0;

  while (start < clean.length) {
    let end = start + chunkSize;

    if (end < clean.length) {
      // 在 chunkSize 附近找「最近的换行/句号」作为更自然的切分点
      const slice = clean.slice(start, end);
      const breakpoints = [
        slice.lastIndexOf("\n"),
        slice.lastIndexOf("。"),
        slice.lastIndexOf(". "),
        slice.lastIndexOf("！"),
        slice.lastIndexOf("？"),
      ].filter((i) => i > chunkSize * 0.4);

      if (breakpoints.length > 0) {
        end = start + Math.max(...breakpoints) + 1;
      }
    }

    chunks.push(clean.slice(start, end).trim());

    if (end >= clean.length) break;
    start = end - overlap;
  }

  return chunks.filter((c) => c.length > 0);
}
