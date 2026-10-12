import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { aiQuota } from "@/lib/guard";
import { classifyApply } from "@/lib/job-contact";
import { PLATFORMS } from "@/lib/platform-search";
import { buildPlatformSearchQuery, searchProvider, webSearch } from "@/lib/web-search";
import { generateSearchPlan, planToQueryLinks, rankJobsByTerms, type SearchPrefs } from "@/lib/job-search-plan";
import { v2exSource } from "@/lib/job-sources/v2ex";

/**
 * 找岗位 Agent。
 *
 * 输入：简历（选已有的、或直接粘文本）+ 目标（城市/远程/年限/薪资/补充说明）
 * 输出：
 *   - 搜索方案：几组"搜索框里能直接用的短词"，每组说明什么时候用
 *   - 每个搜索词 × 各招聘平台的**搜索页链接**（你点开是平台自己的结果页）
 *   - 「已经搜到的岗位」：来自公开源（V2EX 招聘 feed）的真帖子链接
 *
 * 明确不做：抓取 BOSS/智联/猎聘 的搜索结果。那些没有公开接口，
 * 挂登录态去扒的代价是你的账号和服务器 IP。我们只给你链接，你自己点。
 */
export async function POST(req: Request) {
  const session = await verifySession();
  if (!session) return Response.json({ error: "未登录" }, { status: 401 });

  // 这里会调模型，跟其它 AI 接口一样过配额闸
  const limited = aiQuota(session.userId);
  if (limited) return limited;

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "请求体不是合法 JSON" }, { status: 400 });
  }

  const prefsRaw = (body.prefs ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
  const prefs: SearchPrefs = {
    city: str(prefsRaw.city),
    remote: prefsRaw.remote === true,
    years: str(prefsRaw.years),
    salary: str(prefsRaw.salary),
    extra: str(prefsRaw.extra),
    exclude: str(prefsRaw.exclude),
  };

  // 1) 取简历：优先用户粘进来的文本，其次指定/最新的简历
  let resumeText = str(body.text) ?? "";
  let resumeTitle: string | null = null;
  let usedResumeId: string | null = null;

  if (!resumeText) {
    const resumeId = str(body.resumeId);
    const resume = resumeId
      ? await prisma.resume.findFirst({
          where: { id: resumeId, userId: session.userId },
          select: { id: true, title: true, html: true },
        })
      : await prisma.resume.findFirst({
          where: { userId: session.userId },
          orderBy: { updatedAt: "desc" },
          select: { id: true, title: true, html: true },
        });

    if (!resume) {
      return Response.json(
        { error: "还没找到简历。先去「简历工坊」建一份，或把简历内容粘进来。" },
        { status: 400 },
      );
    }
    resumeText = resume.html;
    resumeTitle = resume.title;
    usedResumeId = resume.id;
  }

  // 2) AI 生成搜索方案（失败自动走规则兜底）
  const plan = await generateSearchPlan(resumeText, prefs);
  const queries = planToQueryLinks(plan, prefs);

  // 2b) 具体岗位链接：走搜索引擎的站内查询（site:zhipin.com …）。
  //     没配搜索引擎就跳过 —— 界面会说明，绝不编造链接。
  const provider = searchProvider();
  const domains = PLATFORMS.map((p) => p.domain);
  let searchError: string | null = null;
  const collected: {
    title: string;
    url: string;
    snippet: string;
    kind?: "job" | "list" | "company" | "other";
    platform: string | null;
    fromQuery: string;
  }[] = [];

  if (provider) {
    for (const q of plan.queries.slice(0, 3)) {
      const out = await webSearch(buildPlatformSearchQuery(q.keyword, domains, prefs.city), 8);
      if (!out.ok) {
        searchError ??= out.reason;
        continue;
      }
      for (const h of out.hits) {
        collected.push({
          ...h,
          platform: PLATFORMS.find((p) => h.url.includes(p.domain))?.name ?? null,
          fromQuery: q.keyword,
        });
      }
    }
  }

  // 同一个链接只留一条，最多 12 条
  const seenUrl = new Set<string>();
  const webHits = collected
    .filter((h) => {
      const key = h.url.replace(/#.*$/, "");
      if (seenUrl.has(key)) return false;
      seenUrl.add(key);
      return true;
    })
    .slice(0, 12);

  // 3) 公开源里已经搜到的具体帖子（V2EX 招聘 feed）。
  //    失败不影响主流程 —— 平台链接本来就能用。
  const terms = [...plan.queries.map((q) => q.keyword), ...plan.profile.skills].slice(0, 12);
  let foundPosts: {
    title: string;
    company: string;
    location: string;
    salary: string;
    url: string | null;
    postedAt: string | null;
    applyChannel: string;
    applyEmail: string | null;
  }[] = [];
  let publicSourceError: string | null = null;

  try {
    const posts = await v2exSource.fetch(60);
    foundPosts = rankJobsByTerms(posts, terms, 8).map((p) => {
      const apply = classifyApply(p.contactText);
      return {
        title: p.title,
        company: p.company,
        location: p.location,
        salary: p.salary,
        url: p.url,
        postedAt: p.postedAt ? p.postedAt.toISOString() : null,
        applyChannel: apply.channel,
        applyEmail: apply.email,
      };
    });
  } catch (e) {
    publicSourceError = e instanceof Error ? e.message : String(e);
  }

  return Response.json({
    plan,
    queries,
    foundPosts,
    webSearch: {
      configured: provider !== null,
      provider: provider?.label ?? null,
      error: searchError,
      hits: webHits,
    },
    resumeTitle,
    usedResumeId,
    publicSource: publicSourceError ? { ok: false, error: publicSourceError } : { ok: true },
  });
}
