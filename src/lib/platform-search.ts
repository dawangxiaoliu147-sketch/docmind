/**
 * 招聘平台的搜索链接 —— 纯函数，零 IO。
 *
 * 这一层的定位：**只生成链接，不抓取平台数据**。
 * 你点开就是该平台自己的搜索结果页，登录态、验证码、筛选器全是你自己的，
 * 我们这边一个请求都不发。这样既不用绕反爬，也没有封号与合规问题。
 *
 * 两条曲线救国：
 *   1. `search()` 是各平台的搜索页深链。格式我按公开已知的写法拼，但**平台随时会改**，
 *      所以每条链接都配一个 `fallback()`（用搜索引擎 site: 限定），打不开就走兜底。
 *   2. 城市这类筛选项：**只对确实知道代码的平台**（BOSS）拼地区参数，
 *      其余平台一律不编参数 —— 宁可让你在平台上点一下城市，也不给一个错的链接。
 */

export type PlatformId = "boss" | "zhilian" | "liepin" | "51job" | "lagou" | "eleduck" | "v2ex";

export type Platform = {
  id: PlatformId;
  name: string;
  homepage: string;
  /** 用于搜索引擎兜底的域名 */
  domain: string;
  /** 搜索页深链 */
  search: (keyword: string, city?: string) => string;
  note?: string;
};

const e = (s: string) => encodeURIComponent(s.trim());

/** BOSS 的地区代码（公开的 101xxxxxx 体系，只列常用城市；不在表里就不拼地区参数） */
const BOSS_CITY: Record<string, string> = {
  全国: "100010000",
  北京: "101010100",
  上海: "101020100",
  广州: "101280100",
  深圳: "101280600",
  杭州: "101210100",
  成都: "101270100",
  武汉: "101200100",
  南京: "101190100",
  西安: "101110100",
  苏州: "101190400",
  天津: "101030100",
  重庆: "101040100",
  长沙: "101250100",
  郑州: "101180100",
  青岛: "101120200",
  合肥: "101220100",
};

export const PLATFORMS: Platform[] = [
  {
    id: "boss",
    name: "BOSS直聘",
    homepage: "https://www.zhipin.com",
    domain: "zhipin.com",
    search: (kw, city) => {
      const code = city ? BOSS_CITY[city.replace(/市$/, "")] : undefined;
      return `https://www.zhipin.com/web/geek/job?query=${e(kw)}${code ? `&city=${code}` : ""}`;
    },
    note: "地区用官方代码，能对上就带上",
  },
  {
    id: "zhilian",
    name: "智联招聘",
    homepage: "https://www.zhaopin.com",
    domain: "zhaopin.com",
    search: (kw) => `https://sou.zhaopin.com/?kw=${e(kw)}`,
    note: "只带关键词，城市在上面自己点",
  },
  {
    id: "liepin",
    name: "猎聘",
    homepage: "https://www.liepin.com",
    domain: "liepin.com",
    search: (kw) => `https://www.liepin.com/zhaopin/?key=${e(kw)}`,
  },
  {
    id: "51job",
    name: "前程无忧",
    homepage: "https://www.51job.com",
    domain: "51job.com",
    search: (kw) => `https://we.51job.com/pc/search?keyword=${e(kw)}`,
  },
  {
    id: "lagou",
    name: "拉勾",
    homepage: "https://www.lagou.com",
    domain: "lagou.com",
    search: (kw) => `https://www.lagou.com/wn/jobs?kd=${e(kw)}`,
  },
  {
    id: "eleduck",
    name: "电鸭社区（远程）",
    homepage: "https://eleduck.com",
    domain: "eleduck.com",
    search: (kw) => `https://eleduck.com/search?q=${e(kw)}`,
    note: "远程/兼职岗较多",
  },
  {
    id: "v2ex",
    name: "V2EX 招聘",
    homepage: "https://www.v2ex.com/go/jobs",
    domain: "v2ex.com",
    search: (kw) => `https://www.google.com/search?q=${e(`site:v2ex.com/t ${kw}`)}`,
    note: "具体帖子见下方「已经搜到的岗位」",
  },
];

/**
 * 兜底：用搜索引擎在该平台站内搜。
 * 深链失效时这是最稳的路 —— 搜索引擎的站内结果永远可用，也不需要任何 API key。
 */
export function searchEngineFallback(platform: Platform, keyword: string, city?: string): string {
  const q = [`site:${platform.domain}`, keyword, city].filter(Boolean).join(" ");
  return `https://www.bing.com/search?q=${encodeURIComponent(q)}`;
}

export type PlatformLink = {
  id: PlatformId;
  name: string;
  url: string;
  fallbackUrl: string;
  note?: string;
};

/** 一个关键词 → 每个平台的链接 */
export function buildPlatformLinks(keyword: string, city?: string): PlatformLink[] {
  return PLATFORMS.map((p) => ({
    id: p.id,
    name: p.name,
    url: p.search(keyword, city),
    fallbackUrl: searchEngineFallback(p, keyword, city),
    note: p.note,
  }));
}

export function platformById(id: string): Platform | undefined {
  return PLATFORMS.find((p) => p.id === id);
}
