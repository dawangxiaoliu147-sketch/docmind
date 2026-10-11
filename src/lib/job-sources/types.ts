/**
 * 职位源的统一契约。
 *
 * 设计原则（针对"全真实"这个目标）：
 *   1) 只用**公开可访问**的接口（官方 API / Atom-RSS feed / 政府或企业公开页面）；
 *   2) 不登录、不绕反爬、不伪造浏览器指纹；
 *   3) 每个源都必须说明自己的来源与限制（`note` 直接显示给用户，不藏着）；
 *   4) 每条职位都带 `source` + `sourceId`，可溯源、可去重、可随时停用某个源。
 */

export type JobSourceKind = "feed" | "api";

/** 归一化后的职位（各源解析完都长这样） */
export type RawJob = {
  source: string;
  sourceId: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  requirements: string[];
  tags: string[];
  url: string | null;
  postedAt: Date | null;
  /** 交给 job-contact 抽取投递方式用的原始文本（标题 + 正文） */
  contactText: string;
};

export type JobSource = {
  id: string;
  name: string;
  /** 源主页，界面上可点开核对 */
  homepage: string;
  kind: JobSourceKind;
  /** 这个源是什么、有什么限制。会原样显示给用户 */
  note: string;
  enabledByDefault: boolean;
  fetch(limit: number): Promise<RawJob[]>;
};

/** 抓取用的 UA：明确标识用途，方便对方站点识别与封禁（我们要的是"可持续"，不是"偷偷抓"） */
export const FETCH_UA = "docmind-job-sync/0.1 (+personal job search; respects robots and rate limits)";

/** 带超时的文本抓取。失败就抛出，由上层记成该源的一次失败，不影响其它源。 */
export async function fetchText(url: string, timeoutMs = 15000): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": FETCH_UA, Accept: "application/json, application/atom+xml, application/rss+xml, text/xml, */*;q=0.8" },
      signal: ctrl.signal,
      // 职位数据要新的，别被 Next 的 fetch 缓存挡在前面
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

/** 礼貌间隔：同一个源内连续请求之间至少隔这么久 */
export const POLITE_DELAY_MS = 400;
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
