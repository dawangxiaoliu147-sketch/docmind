import { parseFeed, type FeedEntry } from "./feed";
import { fetchText, type JobSource, type RawJob } from "./types";
import {
  cleanTitle,
  extractRequirements,
  guessCompany,
  guessLocation,
  guessSalary,
  guessTags,
  hashId,
  stripHtml,
  toDescription,
} from "../job-text";

/**
 * 通用 RSS / Atom 源：喂给它**任何**合法的 feed 地址即可。
 *
 * 存在的意义：国内没有统一的职位 API，但很多公开渠道都提供 feed ——
 * 高校就业信息网、企业招聘博客、技术社区节点、政府公共就业平台的订阅等。
 * 你可以把它们的 feed 地址填进环境变量 JOB_RSS_FEEDS（逗号或换行分隔），
 * 同步时就会一起抓。**不填就不抓**，绝不会去猜或去爬没有授权的地方。
 */

const ENV_KEY = "JOB_RSS_FEEDS";

export function configuredRssFeeds(env: NodeJS.ProcessEnv = process.env): string[] {
  return (env[ENV_KEY] ?? "")
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s));
}

export function toRawRssJob(feedUrl: string, entry: FeedEntry): RawJob {
  const body = stripHtml(entry.content);
  const contactText = `${entry.title}\n${body}`;
  const postedMs = Date.parse(entry.published);

  return {
    source: "rss",
    // 跨 feed 唯一：同一个链接在不同 feed 里出现也只入库一次
    sourceId: hashId(feedUrl, entry.id || entry.link || entry.title),
    title: cleanTitle(entry.title),
    company: guessCompany(body) || "未注明公司",
    location: guessLocation(contactText),
    salary: guessSalary(`${entry.title}\n${body}`),
    description: toDescription(body) || cleanTitle(entry.title),
    requirements: extractRequirements(body),
    tags: guessTags(contactText),
    url: (entry.link || "").split("#")[0] || null,
    postedAt: Number.isNaN(postedMs) ? null : new Date(postedMs),
    contactText,
  };
}

export const rssSource: JobSource = {
  id: "rss",
  name: "自定义 RSS/Atom 源",
  homepage: "",
  kind: "feed",
  note: "抓你填在 JOB_RSS_FEEDS 里的 feed，用逗号分隔。没填就不抓。",
  enabledByDefault: false,
  async fetch(limit: number): Promise<RawJob[]> {
    const feeds = configuredRssFeeds();
    if (feeds.length === 0) return [];

    const out: RawJob[] = [];
    const perFeed = Math.max(1, Math.ceil(limit / feeds.length));
    for (const feed of feeds) {
      try {
        const xml = await fetchText(feed);
        for (const e of parseFeed(xml).slice(0, perFeed)) out.push(toRawRssJob(feed, e));
      } catch {
        // 单个 feed 失败不影响其它 feed；失败详情由上层统计
      }
    }
    return out.slice(0, limit);
  },
};
