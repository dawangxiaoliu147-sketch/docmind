/**
 * 职位文本归一化与元信息推断 —— 纯函数，零依赖、零 IO。
 *
 * 真实职位源的标题/正文是自由文本（尤其 V2EX 这类论坛招聘帖），
 * 而职位库的字段是结构化的（公司/地点/薪资/标签/要求），这里负责把前者折成后者。
 * 推断不出就返回空串，**绝不编造** —— 界面上宁可显示"未注明"，也不要给用户一个假的公司名。
 */

/** 常用实体解码（标题里也会出现 `&amp;`，不解码就直接显示给用户了） */
export function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&hellip;/g, "…");
}

/** 去掉 HTML 标签、解码常见实体、压缩空白。真实源的正文多半是 HTML。 */
export function stripHtml(html: string): string {
  return decodeEntities(
    String(html ?? "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
      .replace(/<li[^>]*>/gi, "\n- ")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/[ \t\u00a0]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** 标题去噪：`[招聘] 上海xxx` / `【招聘】xxx` / `招聘：xxx` / `[招聘][北京]xxx` */
export function cleanTitle(raw: string): string {
  let t = decodeEntities(String(raw ?? "")).trim();
  t = t.replace(/^\s*[\[【(（]\s*(招聘|招人|内推|远程|兼职|急招|new)\s*[\]】)）]\s*/gi, "");
  t = t.replace(/^\s*(招聘|招人|内推)\s*[:：]\s*/g, "");
  // 去掉首尾的花哨符号
  t = t.replace(/^[\s\-—_=*~#｜|]+/, "").replace(/[\s\-—_=*~#｜|]+$/, "");
  return t.trim() || decodeEntities(String(raw ?? "")).trim();
}

/** 城市/地点：优先标题里的 [北京] / 【上海·浦东】，其次正文里的 Base / 地点 / 工作地点 */
export function guessLocation(text: string): string {
  const fromBracket = text.match(/[\[【]\s*([^\]】]{2,20}?)\s*[\]】]/);
  if (fromBracket && /(北京|上海|广州|深圳|杭州|成都|武汉|南京|西安|苏州|天津|重庆|长沙|郑州|合肥|厦门|福州|青岛|济南|大连|沈阳|哈尔滨|昆明|贵阳|南宁|海口|石家庄|太原|兰州|乌鲁木齐|无锡|宁波|珠海|东莞|佛山|香港|澳门|台北|新加坡|东京|日本|美国|远程|全国|不限)/.test(fromBracket[1])) {
    return fromBracket[1].replace(/[·・]/g, "·");
  }
  const base = text.match(/(?:Base|base|地点|工作地点|城市|所在地)\s*[:：]?\s*([^\n，,。；;|/]{2,24})/);
  if (base) return base[1].trim();
  const bare = text.match(/(北京|上海|广州|深圳|杭州|成都|武汉|南京|西安|苏州|天津|重庆|长沙|远程|香港|东京|新加坡)/);
  if (bare) return bare[1];
  return "";
}

/**
 * 薪资：`30-60K`、`20K-30K`、`5000-7000元/月`、`月薪 60-70k`、`日薪 800`
 * 抽不到就空着 —— 薪资是最容易被误读的字段，宁缺毋滥。
 */
export function guessSalary(text: string): string {
  const patterns = [
    /\d{1,3}\s*[-–~至]\s*\d{1,3}\s*[kK](?:\s*[·*x×]\s*\d{1,2}\s*薪)?/,
    /\d{1,2}\s*[kK]\s*[-–~至]\s*\d{1,3}\s*[kK]/,
    /\d{4,6}\s*[-–~至]\s*\d{4,6}\s*元?(?:\s*\/\s*月)?/,
    // 带"月薪/薪资/待遇/预算/年薪"标签时，**必须**跟着单位（K/万/元）；
    // 否则 "预算 300 人天"、"公司规模 300 人" 这种会被误当成薪资（实测踩到过）
    /(?:月薪|薪资|薪酬|待遇|预算|年薪|基本薪资)\s*[:：]?\s*(\d{1,4}(?:\s*[-–~至]\s*\d{1,4})?\s*(?:[kK]|万|元)[^\s，,。；;]{0,4})/,
    /(?:日薪|时薪|单价)\s*[:：]?\s*(\d{2,6}\s*(?:[-–~至]\s*\d{2,6})?\s*元?)/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return (m[1] ?? m[0]).replace(/\s+/g, "").trim();
  }
  return "";
}

/** 公司名里出现这些词就说明已经越界到别的字段了（"鹰角网络 主要游戏：…"） */
const COMPANY_STOP_WORD = /(主要|游戏|产品|业务|待遇|薪资|薪酬|职责|要求|福利|地址|规模|融资|简介|岗位|官网|坐标)/;

/** 抓到的公司名再洗一遍：切成一段、遇字段名截断、长度为 2~40 才算数 */
function cleanupCompany(raw: string): string {
  let s = raw.split(/[：:（(【\[]/)[0].trim();
  const stop = s.search(COMPANY_STOP_WORD);
  if (stop > 0) s = s.slice(0, stop).trim();
  s = s.replace(/[\s、,，。；;|·]+$/, "").trim();
  // 以拉丁字母开头的公司名（Global Solutions Delivery…），后面跟的通常是中文描述而非名字本身
  if (/^[A-Za-z]/.test(s)) {
    const cjk = s.search(/[\u4e00-\u9fa5]/);
    if (cjk > 0) s = s.slice(0, cjk).replace(/[\s、,，。；;|·]+$/, "").trim();
  }
  // 上限 40：英文公司名本来就长，卡 30 会把合法的砍掉
  return s.length >= 2 && s.length <= 40 ? s : "";
}

/**
 * 公司名：只认显式标注，且**允许空**。
 * 宁可显示"未注明公司"，也不要把"主要游戏：明日方舟"当成公司名塞给用户。
 */
export function guessCompany(text: string): string {
  const patterns = [
    /公司名称\s*[:：]\s*([^\n，,。；;|、：:]{2,40})/,
    /公司名\s*[:：]\s*([^\n，,。；;|、：:]{2,40})/,
    /公司\s*[:：]\s*([^\n，,。；;|、：:]{2,40})/,
    /企业\s*[:：]\s*([^\n，,。；;|、：:]{2,40})/,
    /会社\s*[:：]\s*([^\n，,。；;|、：:]{2,40})/,
    /(?:团队|部门)\s*[:：]\s*([^\n，,。；;|、：:]{2,40})/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const cleaned = cleanupCompany(m[1]);
      if (cleaned) return cleaned;
    }
  }
  return "";
}

/** 技能标签关键词表（顺序即优先级）。ASCII 词要求词边界，中文词直接包含匹配。 */
const TAG_WORDS: string[] = [
  "TypeScript", "JavaScript", "React", "Vue", "Next.js", "Node.js", "Go", "Golang", "Java", "Python",
  "Rust", "C++", "C#", "PHP", "Ruby", "Swift", "Kotlin", "Flutter", "React Native", "Android", "iOS",
  "Kubernetes", "K8s", "Docker", "DevOps", "CI/CD", "Linux", "MySQL", "PostgreSQL", "Redis", "MongoDB",
  "Kafka", "微服务", "分布式", "高并发", "LLM", "RAG", "Agent", "PyTorch", "TensorFlow", "推荐系统",
  "算法", "数据分析", "SQL", "前端", "后端", "全栈", "测试", "运维", "安全", "渗透", "UI", "设计",
  "产品经理", "运营", "销售", "SEO", "远程", "兼职", "实习", "React", "Web3", "区块链", "Solidity",
  "Unity", "游戏", "嵌入式", "硬件", "爬虫", "数据标注",
];

export function guessTags(text: string): string[] {
  const out: string[] = [];
  for (const w of TAG_WORDS) {
    if (out.includes(w)) continue;
    const hit = /^[\x00-\x7F]+$/.test(w)
      ? new RegExp(`(^|[^A-Za-z0-9+#.])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^A-Za-z0-9+#]|$)`, "i").test(text)
      : text.includes(w);
    if (hit) out.push(w);
    if (out.length >= 8) break;
  }
  return out;
}

/**
 * 从正文抽"要求/职责"列表：以 - / • / * / 1. / 1、 开头的行。
 * 抽不到就返回空数组（详情页在空列表时会隐藏该面板，见 jobs/[id]/page.tsx）。
 */
export function extractRequirements(description: string): string[] {
  const lines = description.split("\n").map((l) => l.trim());
  const items: string[] = [];
  for (const line of lines) {
    const m = line.match(/^(?:[-•*·]|\d{1,2}[.、)])\s*(.{4,120})$/);
    if (m) items.push(m[1].trim());
    if (items.length >= 12) break;
  }
  return items;
}

/** 正文里挑一段当"职位描述"：去掉纯联系方式行与空行，取前 N 行 */
export function toDescription(text: string, maxLines = 40): string {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  return lines.slice(0, maxLines).join("\n");
}

/**
 * 稳定短 id（FNV-1a 32 位 + 长度混合）。用于没有天然 id 的源（RSS），
 * 保证同一篇帖子每次同步算出同一个 sourceId → 不会重复入库。
 * 刻意不用 node:crypto：这个文件可能被客户端组件间接引用，不能依赖 node 内置模块。
 */
export function hashId(...parts: string[]): string {
  const s = parts.join("\u0001");
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `${h.toString(36)}${s.length.toString(36)}`;
}
