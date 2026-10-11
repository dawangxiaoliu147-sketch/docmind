/**
 * 「一键抓当前页」的解析层 —— 纯函数，零 IO。
 *
 * 两种输入：
 *   1) 书签脚本生成的带信封文本（`【docmind 抓取】 url: … title: … --- 正文`）
 *   2) 你在平台上 Ctrl+A / Ctrl+C 直接粘过来的整页文本
 *
 * 设计原则（很重要）：**平台页面格式五花八门，解析只能尽力而为**。
 * 所以这里做三件事：
 *   - 每个字段都标出是"明确读到"的还是"缺的"，界面据此提示你核对；
 *   - 给一个 confidence 分数，低分就在界面上标黄；
 *   - **绝不在没有依据时编公司名/薪资**（宁可空着让用户填）。
 */

import { classifyApply, type ApplyInfo } from "./job-contact";
import {
  cleanTitle,
  extractRequirements,
  guessCompany,
  guessLocation,
  guessSalary,
  guessTags,
  hashId,
  toDescription,
} from "./job-text";

export type Platform = "boss" | "zhilian" | "liepin" | "51job" | "lagou" | "other";

export type ParsedJob = {
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  requirements: string[];
  tags: string[];
  /** 原始职位链接（书签脚本会带上；直接粘贴时通常没有，界面可手填） */
  url: string | null;
  apply: ApplyInfo;
  platform: Platform;
  /** 0~1：字段命中比例，界面低于 0.6 就提示"请核对" */
  confidence: number;
  /** 哪些字段是推断/缺失，需要用户确认 */
  uncertain: string[];
};

const PLATFORM_HINTS: { id: Platform; name: string; hosts: string[]; words: string[] }[] = [
  { id: "boss", name: "BOSS直聘", hosts: ["zhipin.com"], words: ["BOSS直聘", "boss直聘"] },
  { id: "zhilian", name: "智联招聘", hosts: ["zhaopin.com"], words: ["智联招聘"] },
  { id: "liepin", name: "猎聘", hosts: ["liepin.com"], words: ["猎聘"] },
  { id: "51job", name: "前程无忧", hosts: ["51job.com"], words: ["前程无忧", "51JOB"] },
  { id: "lagou", name: "拉勾", hosts: ["lagou.com"], words: ["拉勾"] },
];

export function detectPlatform(text: string, url: string | null): Platform {
  const hay = `${url ?? ""}\n${text.slice(0, 4000)}`;
  for (const p of PLATFORM_HINTS) {
    if (p.hosts.some((h) => hay.toLowerCase().includes(h))) return p.id;
    if (p.words.some((w) => hay.includes(w))) return p.id;
  }
  return "other";
}

export function platformName(p: Platform): string {
  return PLATFORM_HINTS.find((x) => x.id === p)?.name ?? "其他渠道";
}

/** 书签脚本生成的信封头 */
const ENVELOPE_MARK = "【docmind 抓取】";

export type Envelope = { url: string | null; title: string | null; body: string };

/** 解析书签脚本的信封（没有信封就原样返回） */
export function parseEnvelope(raw: string): Envelope {
  const text = String(raw ?? "").replace(/\r\n/g, "\n");
  if (!text.includes(ENVELOPE_MARK)) return { url: null, title: null, body: text };

  const afterMark = text.slice(text.indexOf(ENVELOPE_MARK) + ENVELOPE_MARK.length);
  const [head, ...rest] = afterMark.split(/\n---\n/);
  const body = rest.join("\n---\n").trim() || afterMark.trim();
  const url = head.match(/^\s*url\s*[:：]\s*(\S+)/im)?.[1] ?? null;
  const title = head.match(/^\s*title\s*[:：]\s*(.+)$/im)?.[1]?.trim() ?? null;
  return { url, title, body };
}

/** 职位标题：优先信封里的 title，其次第一行像标题的行 */
function pickTitle(lines: string[], envelopeTitle: string | null): string {
  if (envelopeTitle) {
    // 平台页面的 <title> 常带后缀，如「前端开发工程师 - BOSS直聘」
    const cleaned = cleanTitle(envelopeTitle.replace(/[-_|｜]\s*(BOSS直聘|智联招聘|猎聘|前程无忧|拉勾).*$/i, ""));
    if (cleaned.length >= 2 && cleaned.length <= 60) return cleaned;
  }
  for (const line of lines.slice(0, 12)) {
    const t = cleanTitle(line);
    if (t.length < 2 || t.length > 40) continue;
    if (/^[\d\s.,:：\-–~+kK元万/]+$/.test(t)) continue; // 纯数字/薪资行
    if (/^(职位描述|岗位职责|任职要求|工作职责|职位详情|公司介绍|薪资|城市|学历|经验)/.test(t)) continue;
    if (/^(boss直聘|智联招聘|猎聘|前程无忧|拉勾)$/i.test(t)) continue;
    return t;
  }
  return "";
}

/**
 * 主入口：把粘贴文本解析成职位字段。
 * 解析不出来的字段留空并在 `uncertain` 里标出，由界面提示用户补 —— 绝不编造。
 */
export function parsePastedJob(raw: string, explicitUrl?: string | null): ParsedJob {
  const env = parseEnvelope(raw);
  const text = env.body;
  const url = (explicitUrl || env.url || "").trim() || null;

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const title = pickTitle(lines, env.title);
  const company = guessCompany(text);
  const salary = guessSalary(text);
  const location = guessLocation(text);
  const requirements = extractRequirements(text);
  const tags = guessTags(text);

  // 描述：从"职位描述/岗位职责"这类标题开始截；找不到就用正文前 40 行
  const descStart = lines.findIndex((l) =>
    /^(职位描述|岗位职责|工作职责|职位详情|岗位描述|工作内容)/.test(l),
  );
  const descBody = descStart >= 0 ? lines.slice(descStart + 1).join("\n") : text;
  const description = toDescription(descBody).trim() || toDescription(text).trim();

  const apply = classifyApply(text);
  // 平台岗位基本不给邮箱，投递方式就是"打开这个链接去聊"
  const applyInfo: ApplyInfo =
    apply.channel === "unknown" && url
      ? { channel: "link", email: null, url, contact: null }
      : { ...apply, url: apply.url ?? url };

  const uncertain: string[] = [];
  if (!title) uncertain.push("title");
  if (!company) uncertain.push("company");
  if (!salary) uncertain.push("salary");
  if (!location) uncertain.push("location");
  const found = 4 - uncertain.length;
  const confidence = Math.round((found / 4) * 100) / 100;

  return {
    title,
    company,
    location,
    salary,
    description,
    requirements,
    tags,
    url,
    apply: applyInfo,
    platform: detectPlatform(text, url),
    confidence,
    uncertain,
  };
}

/** 给"手动添加/粘贴"的职位算一个稳定的去重键（同一条帖子重复导入不会产生副本） */
export function pasteSourceId(p: Pick<ParsedJob, "url" | "title" | "company">): string {
  return hashId(p.url || `${p.title}\u0001${p.company}`);
}
