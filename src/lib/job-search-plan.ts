import "server-only";
import { generateTextResilient } from "./ai";
import { firstSummaryLine, guessTags, guessYears, stripHtml } from "./job-text";
import { buildPlatformLinks, type PlatformLink } from "./platform-search";

/**
 * 找岗位的 Agent：读你的简历 → 产出"在各平台搜索框里能直接用的搜索词" → 拼出各平台的搜索链接。
 *
 * 三条重要边界（写在代码里，也写在界面上）：
 *   1. **不抓取招聘平台**。我们只生成链接，你点开是平台自己的搜索结果页。
 *   2. AI 只做"读简历 + 写搜索词"这件事。AI 失败时走**规则兜底**（纯函数），功能不瘫。
 *   3. 搜索词只依据简历里真实写过的东西 —— 抽不到就留空并提示你补，绝不编经历。
 */

export type SearchPrefs = {
  city?: string;
  remote?: boolean;
  years?: string;
  salary?: string;
  /** 用户补充要求，例如"只看 AI 方向""不接受外包" */
  extra?: string;
  /** 排除词（平台搜索不支持排除语法，只作为提示） */
  exclude?: string;
};

export type SearchQuery = {
  label: string;
  keyword: string;
  why: string;
};

export type SearchPlan = {
  profile: {
    titles: string[];
    skills: string[];
    years: string | null;
    summary: string | null;
  };
  queries: SearchQuery[];
  notes: string[];
  /** 是否真的用上了 AI（false = 规则兜底） */
  aiUsed: boolean;
  /** 兜底时告知原因，界面会显示 */
  warning?: string;
};

export type QueryLinks = {
  query: SearchQuery;
  links: PlatformLink[];
};

// ── 纯函数部分（可单测，不依赖网络与 AI）─────────────────────────────

/** 岗位名：优先"求职意向/目标岗位"这类显式标注，其次从正文里认岗位名 */
export function guessTitles(text: string): string[] {
  const out: string[] = [];
  const explicit = text.match(
    /(?:求职意向|求职目标|目标岗位|期望职位|应聘(?:职位|岗位))\s*[:：]\s*([^\n，,。；;]{2,20})/,
  );
  if (explicit) out.push(explicit[1].trim());

  const re = /([\u4e00-\u9fa5A-Za-z]{2,12}(?:工程师|开发|设计师|运营|产品经理|项目经理|测试|运维|算法|架构师|分析师|研究员|主管|经理|专员|顾问))/g;
  for (const m of text.matchAll(re)) {
    const t = m[1].trim();
    if (!out.includes(t)) out.push(t);
    if (out.length >= 3) break;
  }
  return out.slice(0, 3);
}

/** 技能反推岗位名（简历里没写职位时用） */
export function titlesFromSkills(skills: string[]): string[] {
  const s = new Set(skills);
  const hit = (arr: string[]) => arr.some((x) => s.has(x));
  const out: string[] = [];
  if (hit(["React", "Vue", "TypeScript", "JavaScript", "Next.js", "前端"])) out.push("前端开发工程师");
  if (hit(["Java", "Go", "Golang", "Python", "Node.js", "后端", "微服务", "分布式", "高并发"])) {
    out.push("后端开发工程师");
  }
  if (hit(["LLM", "RAG", "Agent", "PyTorch", "TensorFlow", "算法", "推荐系统"])) out.push("算法工程师");
  if (hit(["运维", "Kubernetes", "K8s", "Docker", "DevOps", "Linux"])) out.push("运维开发工程师");
  if (hit(["测试"])) out.push("测试工程师");
  if (hit(["UI", "设计"])) out.push("UI 设计师");
  return out.slice(0, 2);
}

/** 去掉级别词：「高级前端工程师」→「前端工程师」，结果会多很多 */
export function stripLevel(title: string): string {
  return title
    .replace(/高级|资深|中级|初级|首席|senior|junior|lead/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** 规则兜底：不依赖 AI 也能给出一份能用的搜索方案 */
export function fallbackPlan(resumeText: string, prefs: SearchPrefs): SearchPlan {
  const skills = guessTags(resumeText).slice(0, 8);
  const years = prefs.years?.trim() || guessYears(resumeText);
  const titles = guessTitles(resumeText);
  const derived = titles.length === 0 ? titlesFromSkills(skills) : [];
  const allTitles = [...titles, ...derived];
  const primary = allTitles[0] ?? "";
  const broad = primary ? stripLevel(primary) : "";
  const city = prefs.city?.trim() || "";

  const queries: SearchQuery[] = [];
  if (primary) queries.push({ label: "主关键词", keyword: primary, why: "岗位名，结果最多" });
  if (broad && broad !== primary) {
    queries.push({ label: "去掉级别词", keyword: broad, why: "级别词会砍掉大量结果" });
  }
  if (skills[0]) {
    queries.push({
      label: "技能组合",
      keyword: `${broad || primary || skills[0]} ${skills[0]}`,
      why: `强调 ${skills[0]}`,
    });
  }
  if (city) {
    queries.push({ label: "城市限定", keyword: `${broad || primary} ${city}`, why: `只看${city}` });
  }
  if (prefs.remote) {
    queries.push({ label: "远程", keyword: `${broad || primary} 远程`, why: "远程岗" });
  }

  const notes: string[] = [];
  if (!primary) {
    notes.push("简历里没读出明确的岗位名。在简历顶部写一行「求职意向：×××」会让搜索准很多。");
  } else if (derived.length > 0) {
    notes.push("岗位名是按你的技能猜的，改一下「补充说明」能让它更准。");
  }
  if (!city && !prefs.remote) notes.push("没填城市。平台上的城市筛选要你自己点一下。");
  if (skills.length === 0) notes.push("简历里没读到技能关键词，搜索结果可能偏泛。");
  if (prefs.exclude?.trim()) {
    notes.push(`平台搜索框不支持排除语法，「${prefs.exclude.trim()}」只能在结果里自己跳过。`);
  }

  return {
    profile: { titles: allTitles, skills, years, summary: firstSummaryLine(resumeText) },
    queries: queries.slice(0, 6),
    notes: notes.slice(0, 3),
    aiUsed: false,
  };
}

/** 容错解析 AI 返回的 JSON —— 形状不对就返回 null，交给兜底 */
export function parsePlanJson(raw: string): Omit<SearchPlan, "aiUsed" | "warning"> | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(match[0]) as Record<string, unknown>;
  } catch {
    return null;
  }

  const strArr = (v: unknown, max: number): string[] =>
    Array.isArray(v)
      ? v
          .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
          .map((x) => x.trim().slice(0, 30))
          .slice(0, max)
      : [];

  const queries: SearchQuery[] = [];
  if (Array.isArray(obj.queries)) {
    for (const item of obj.queries) {
      if (!item || typeof item !== "object") continue;
      const it = item as Record<string, unknown>;
      const keyword = typeof it.keyword === "string" ? it.keyword.trim().slice(0, 30) : "";
      if (!keyword) continue;
      queries.push({
        label: typeof it.label === "string" && it.label.trim() ? it.label.trim().slice(0, 12) : "搜索词",
        keyword,
        why: typeof it.why === "string" ? it.why.trim().slice(0, 40) : "",
      });
      if (queries.length >= 6) break;
    }
  }
  // 关键词去重
  const uniq = queries.filter((q, i) => queries.findIndex((x) => x.keyword === q.keyword) === i);
  if (uniq.length === 0) return null;

  const years = typeof obj.years === "string" && obj.years.trim() ? obj.years.trim().slice(0, 4) : null;
  const summary = typeof obj.summary === "string" && obj.summary.trim() ? obj.summary.trim().slice(0, 80) : null;

  return {
    profile: { titles: strArr(obj.titles, 4), skills: strArr(obj.skills, 10), years, summary },
    queries: uniq,
    notes: strArr(obj.notes, 3),
  };
}

/** 方案 → 每个搜索词配一套平台链接 */
export function planToQueryLinks(plan: SearchPlan, prefs: SearchPrefs): QueryLinks[] {
  return plan.queries.map((query) => ({
    query,
    links: buildPlatformLinks(query.keyword, prefs.city),
  }));
}

export type PostLike = {
  title: string;
  description?: string;
  tags?: string[];
  company?: string;
  url?: string | null;
  postedAt?: Date | null;
};

/**
 * 按搜索词给"真抓到的帖子"打分排序（只给公开源用，比如 V2EX 招聘 feed）。
 * 标题命中权重最高，其次标签，最后正文；一个都不命中就不返回 —— 不硬凑相关性。
 */
export function rankJobsByTerms<T extends PostLike>(posts: T[], terms: string[], limit = 8): T[] {
  const cleaned = terms.map((t) => t.trim().toLowerCase()).filter((t) => t.length > 0);
  if (cleaned.length === 0) return [];

  const scored = posts
    .map((p) => {
      const title = (p.title ?? "").toLowerCase();
      const tags = (p.tags ?? []).join(" ").toLowerCase();
      const body = (p.description ?? "").toLowerCase();
      let score = 0;
      for (const t of cleaned) {
        if (title.includes(t)) score += 3;
        if (tags.includes(t)) score += 2;
        if (body.includes(t)) score += 1;
      }
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((x) => x.p);
}

// ── AI 部分（失败就兜底，不让功能瘫）───────────────────────────────

// @copy-check-ignore-start —— 下面是发给模型的提示词，里面的 markdown 不会显示给用户
function buildPrompt(resumeText: string, prefs: SearchPrefs): string {
  const goal = [
    prefs.city ? `城市=${prefs.city}` : "",
    prefs.remote ? "接受远程=是" : "",
    prefs.years ? `年限=${prefs.years}` : "",
    prefs.salary ? `期望薪资=${prefs.salary}` : "",
    prefs.extra ? `补充=${prefs.extra}` : "",
    prefs.exclude ? `不接受=${prefs.exclude}` : "",
  ]
    .filter(Boolean)
    .join("；");

  return `你在帮一个求职者准备招聘平台的搜索词。读他的简历，给出**搜索框里能直接用的短词**。

硬性要求：
1. keyword 是 2~10 个字的短词（岗位名，或"岗位名 + 技术词"）。不要写句子，不要写"帮我找"。
2. 给 3~6 组，尽量覆盖：主岗位名；去掉级别词的宽口径（"高级/资深"会砍掉很多结果）；核心技术栈组合${
    prefs.city ? "；带上城市的组合" : ""
  }${prefs.remote ? "；远程" : ""}。
3. 只用简历里真实出现过的技能和经历，**不要编造**。
4. label 是 2~6 个字的短语；why 一句话（20 字内）说明这组词什么时候用。
5. notes 给 0~3 条"补什么信息能让搜索更准"。

只输出 JSON，不要任何解释：
{"titles":["岗位名"],"skills":["技能"],"years":"3","summary":"一句话定位","queries":[{"label":"主关键词","keyword":"前端开发","why":"结果最多"}],"notes":["..."]}

目标：${goal || "（未填，按简历自己判断）"}

简历正文：
${resumeText.slice(0, 3000)}`;
}
// @copy-check-ignore-end

/**
 * 生成搜索方案：先试 AI，失败或结果不合规就用规则兜底。
 * `now` 不需要注入 —— 这里不涉及时间。
 */
export async function generateSearchPlan(
  resumePlainText: string,
  prefs: SearchPrefs,
): Promise<SearchPlan> {
  const text = stripHtml(resumePlainText);
  if (text.trim().length < 20) {
    return {
      ...fallbackPlan(text, prefs),
      warning: "简历内容太少，读不出有效信息。",
    };
  }

  try {
    const result = await generateTextResilient({
      system: "你是求职搜索助手，只输出 JSON。",
      prompt: buildPrompt(text, prefs),
    });
    const parsed = parsePlanJson(result.text);
    if (!parsed) {
      return { ...fallbackPlan(text, prefs), warning: "AI 返回的内容没法解析，已改用规则生成。" };
    }
    return {
      ...parsed,
      aiUsed: true,
      ...(result.usedFallback ? { warning: "主用模型额度用完，这次用的是备用模型。" } : {}),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ...fallbackPlan(text, prefs),
      warning: `AI 调用失败（${msg.slice(0, 60)}），已改用规则生成。`,
    };
  }
}
