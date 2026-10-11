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

const FEED_URL = "https://www.v2ex.com/feed/jobs.xml";

/**
 * 从 Atom 的 id（形如 `tag:www.v2ex.com,2026-10-10:/t/1247753`）或链接里取 topic id。
 * 这是去重的关键：API 与 feed 两条路拿到的同一条帖子，必须算出同一个 sourceId。
 */
export function v2exTopicId(idOrLink: string): string {
  const m = String(idOrLink).match(/\/t\/(\d+)/);
  return m ? m[1] : hashId(String(idOrLink));
}

/** feed 条目 → 归一化职位（纯函数，可断言） */
export function toRawV2exJob(entry: FeedEntry): RawJob {
  const body = stripHtml(entry.content);
  const contactText = `${entry.title}\n${body}`;
  const postedMs = Date.parse(entry.published);

  return {
    source: "v2ex",
    sourceId: v2exTopicId(entry.id || entry.link),
    title: cleanTitle(entry.title),
    company: guessCompany(body) || "未注明公司",
    location: guessLocation(contactText),
    // 薪资常写在标题里（"月薪 60-70k"），所以连标题一起扫
    salary: guessSalary(`${entry.title}\n${body}`),
    description: toDescription(body) || cleanTitle(entry.title),
    requirements: extractRequirements(body),
    tags: guessTags(contactText),
    // 去掉 #reply0 这类锚点，链接更干净
    url: entry.link.split("#")[0] || null,
    postedAt: Number.isNaN(postedMs) ? null : new Date(postedMs),
    contactText,
  };
}

export const v2exSource: JobSource = {
  id: "v2ex",
  name: "V2EX 招聘",
  homepage: "https://www.v2ex.com/go/jobs",
  kind: "feed",
  note: "V2EX 招聘节点的官方 Atom feed（公开、无需登录）。国内技术岗为主，实测约六成帖子直接给了邮箱 —— 这类可以真正自动化投递。一次最多 50 条。",
  enabledByDefault: true,
  async fetch(limit: number): Promise<RawJob[]> {
    const xml = await fetchText(FEED_URL);
    return parseFeed(xml)
      .slice(0, Math.max(1, limit))
      .map(toRawV2exJob);
  },
};
