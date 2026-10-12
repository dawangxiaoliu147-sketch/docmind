import "server-only";

/**
 * 搜索引擎接入：用来拿"具体某条岗位"的链接。
 *
 * 为什么需要它：BOSS直聘、智联、猎聘这些平台不开放给程序查询，但它们的具体岗位页
 * 被搜索引擎收录了 —— 用 `site:zhipin.com 前端开发` 这种站内查询，就能拿到公开可访问的
 * 具体岗位链接。这不是抓平台，是查搜索引擎。
 *
 * 支持三家，配了哪家就用哪家（也可以用 SEARCH_PROVIDER 指定）：
 *   SEARCH_PROVIDER=brave    BRAVE_API_KEY
 *   SEARCH_PROVIDER=tavily   TAVILY_API_KEY
 *   SEARCH_PROVIDER=google   GOOGLE_API_KEY + GOOGLE_CSE_ID
 * 一家都没配时 `webSearch()` 返回 { ok: false }，界面上就只说"没配搜索引擎" —— 绝不编造链接。
 */

/** 链接类型：岗位详情页 / 列表页 / 公司页 / 其他。搜索 API 会把这几类混着返回 */
export type HitKind = "job" | "list" | "company" | "other";

export type SearchHit = { title: string; url: string; snippet: string; kind?: HitKind };

/**
 * 认一下这条链接是"某个岗位"还是"一页列表"。
 * 实测 Tavily 搜站点时，列表页和公司页会和具体岗位混在一起 —— 不区分的话用户白点。
 */
export function classifyHit(url: string): HitKind {
  const u = url.toLowerCase();
  if (/\/(company|companies)\//.test(u)) return "company";
  // 岗位详情页的常见形态
  if (
    /\/job_detail\//.test(u) ||
    /\/job\/[^/]*\d/.test(u) ||
    /\/jobs?\/[a-z0-9-]+\.html/.test(u) ||
    /\/position\//.test(u) ||
    /jobid=/.test(u) ||
    /\/job\/\d+/.test(u) ||
    // 智联的真实岗位页长这样：jobs.zhaopin.com/CC120859660J40350176005.htm
    /\/c{1,2}\d{6,}[a-z0-9]*\.html?/.test(u)
  ) {
    return "job";
  }
  // 列表/聚合页的常见形态
  if (/\/zhaopin\//.test(u) || /\/city-/.test(u) || /\/career/.test(u) || /\/search/.test(u) || /\?query=|keyword=|kd=/.test(u)) {
    return "list";
  }
  return "other";
}

/** 岗位详情页排最前，列表页与公司页排最后（只排序，不丢弃） */
export function rankHits(hits: SearchHit[]): SearchHit[] {
  const weight: Record<HitKind, number> = { job: 0, other: 1, list: 2, company: 3 };
  return hits
    .map((h) => ({ ...h, kind: h.kind ?? classifyHit(h.url) }))
    .sort((a, b) => weight[a.kind ?? "other"] - weight[b.kind ?? "other"]);
}

export type SearchOutcome =
  | { ok: true; provider: string; hits: SearchHit[] }
  | { ok: false; reason: string };

type Provider = { id: "brave" | "tavily" | "google"; label: string };

/** 当前可用的搜索服务（没配就返回 null） */
export function searchProvider(): Provider | null {
  const picked = (process.env.SEARCH_PROVIDER || "").trim().toLowerCase();
  const has = {
    brave: Boolean(process.env.BRAVE_API_KEY),
    tavily: Boolean(process.env.TAVILY_API_KEY),
    google: Boolean(process.env.GOOGLE_API_KEY && process.env.GOOGLE_CSE_ID),
  };
  const labels: Record<string, string> = { brave: "Brave Search", tavily: "Tavily", google: "Google CSE" };

  if (picked === "brave" || picked === "tavily" || picked === "google") {
    return has[picked] ? { id: picked as Provider["id"], label: labels[picked] } : null;
  }
  if (has.brave) return { id: "brave", label: labels.brave };
  if (has.tavily) return { id: "tavily", label: labels.tavily };
  if (has.google) return { id: "google", label: labels.google };
  return null;
}

const TRACKING = /^(utm_|gclid$|fbclid$|spm$|scm$|from$)/i;

/** 清掉跟踪参数、去重、剔掉非 http 的链接 */
export function cleanHits(
  raw: { title?: string; url?: string; snippet?: string }[],
  limit: number,
): SearchHit[] {
  const out: SearchHit[] = [];
  const seen = new Set<string>();

  for (const item of raw) {
    const url = (item.url ?? "").trim();
    if (!/^https?:\/\//i.test(url)) continue;

    let cleaned = url;
    try {
      const u = new URL(url);
      for (const key of [...u.searchParams.keys()]) {
        if (TRACKING.test(key)) u.searchParams.delete(key);
      }
      cleaned = u.toString();
    } catch {
      // URL 解析失败就保留原样
    }

    const key = cleaned.replace(/#.*$/, "");
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      title: (item.title ?? "").trim().slice(0, 120) || cleaned,
      url: cleaned,
      snippet: (item.snippet ?? "").trim().slice(0, 200),
    });
    if (out.length >= limit) break;
  }
  return out;
}

async function getJson(url: string, init: RequestInit, timeoutMs: number): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal, cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// 同一个查询 10 分钟内不重复打搜索 API（省额度）
const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; hits: SearchHit[] }>();

/** 查一次搜索引擎。失败/未配置都返回 ok:false，由调用方决定怎么显示。 */
export async function webSearch(query: string, limit = 8, timeoutMs = 12000): Promise<SearchOutcome> {
  const provider = searchProvider();
  if (!provider) return { ok: false, reason: "未配置搜索引擎 API" };

  const q = query.trim();
  if (!q) return { ok: false, reason: "查询为空" };

  const cacheKey = `${provider.id}:${limit}:${q}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return { ok: true, provider: provider.label, hits: hit.hits };
  }

  try {
    let raw: { title?: string; url?: string; snippet?: string }[] = [];

    if (provider.id === "brave") {
      const data = (await getJson(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=${limit}`,
        { headers: { Accept: "application/json", "X-Subscription-Token": process.env.BRAVE_API_KEY ?? "" } },
        timeoutMs,
      )) as { web?: { results?: { title?: string; url?: string; description?: string }[] } };
      raw = (data.web?.results ?? []).map((r) => ({ title: r.title, url: r.url, snippet: r.description }));
    } else if (provider.id === "tavily") {
      const data = (await getJson(
        "https://api.tavily.com/search",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: process.env.TAVILY_API_KEY,
            query: q,
            max_results: limit,
            search_depth: "basic",
          }),
        },
        timeoutMs,
      )) as { results?: { title?: string; url?: string; content?: string }[] };
      raw = (data.results ?? []).map((r) => ({ title: r.title, url: r.url, snippet: r.content }));
    } else {
      const data = (await getJson(
        `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(
          process.env.GOOGLE_API_KEY ?? "",
        )}&cx=${encodeURIComponent(process.env.GOOGLE_CSE_ID ?? "")}&num=${limit}&q=${encodeURIComponent(q)}`,
        { headers: { Accept: "application/json" } },
        timeoutMs,
      )) as { items?: { title?: string; link?: string; snippet?: string }[] };
      raw = (data.items ?? []).map((r) => ({ title: r.title, url: r.link, snippet: r.snippet }));
    }

    const hits = rankHits(cleanHits(raw, limit));
    cache.set(cacheKey, { at: Date.now(), hits });
    return { ok: true, provider: provider.label, hits };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : String(e) };
  }
}

/** 站内查询：只在招聘平台的域名里搜具体岗位 */
export function buildPlatformSearchQuery(keyword: string, domains: string[], city?: string): string {
  const sites = domains.map((d) => `site:${d}`).join(" OR ");
  return [`(${sites})`, keyword.trim(), city?.trim()].filter(Boolean).join(" ");
}
