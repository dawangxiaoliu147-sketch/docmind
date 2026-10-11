/**
 * 极简 Atom / RSS 解析（零依赖，正则实现）。
 *
 * 为什么不用 xml 库：这个项目一贯零依赖能跑就跑（kubesage 是范本），
 * 而我们要的字段就那么几个，且都能被测试覆盖（见 job-sources 的断言用例）。
 * 解析器只负责"把 feed 拆成条目"，脏活（去 HTML、猜字段）交给 job-text。
 */

export type FeedEntry = {
  title: string;
  link: string;
  /** feed 自带的稳定 id（Atom 的 <id> 或 RSS 的 <guid>），没有就用链接 */
  id: string;
  published: string;
  /** 正文（可能是 HTML） */
  content: string;
};

function decodeCdata(s: string): string {
  const m = s.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  return (m ? m[1] : s).trim();
}

function tag(block: string, names: string[]): string {
  for (const n of names) {
    const re = new RegExp(`<${n}(?:\\s[^>]*)?>([\\s\\S]*?)</${n}>`, "i");
    const m = block.match(re);
    if (m) {
      const v = decodeCdata(m[1]);
      if (v) return v;
    }
  }
  return "";
}

/** Atom: <link rel="alternate" href="…"/>；RSS: <link>…</link> */
function linkOf(block: string): string {
  const atom = block.match(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*\/?>/i);
  if (atom) return decodeCdata(atom[1]);
  return tag(block, ["link"]);
}

/** 拆出条目：Atom 用 <entry>，RSS 用 <item> */
export function parseFeed(xml: string): FeedEntry[] {
  const blocks: string[] = [];
  for (const tagName of ["entry", "item"]) {
    const re = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)</${tagName}>`, "gi");
    for (const m of xml.matchAll(re)) blocks.push(m[1]);
    if (blocks.length > 0) break; // 命中一种就够，别把两种混在一起
  }

  return blocks
    .map((b) => ({
      title: tag(b, ["title"]),
      link: linkOf(b),
      id: tag(b, ["id", "guid"]) || linkOf(b),
      published: tag(b, ["published", "updated", "pubDate", "dc:date"]),
      content: tag(b, ["content", "content:encoded", "description", "summary"]),
    }))
    .filter((e) => e.title && e.link);
}
