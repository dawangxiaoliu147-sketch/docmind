/**
 * 从职位正文里抽取「怎么投递」—— 纯函数，无 IO，可被 node 直接断言。
 *
 * 为什么单独一层：国内招聘帖的联系方式五花八门（邮箱、投递链接、微信、TG），
 * 抽错一个字符就等于把简历发到别人手里，所以这里的每条规则都要能被测到。
 * 现实里最高价值的是 **email**：邮件投递既合规又能真正自动化（见 lib/job-email 的邮件助手）。
 */

export type ApplyChannel = "email" | "link" | "wechat" | "unknown";

export type ApplyInfo = {
  channel: ApplyChannel;
  email: string | null;
  /** 投递链接（ATS / 表单 / 招聘页） */
  url: string | null;
  /** 微信 / TG 等原文，保留供人工使用 */
  contact: string | null;
};

/** 常见邮箱 */
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
/** 图片/静态资源名长得像邮箱（logo@2x.png），要排掉 */
const EMAIL_NOISE_RE = /@[0-9.]*x?\.(png|jpg|jpeg|gif|webp|svg|css|js|ico)$/i;

/**
 * 从文本抽邮箱。
 * 除了标准写法，还处理两种真实存在的"防爬/防骚扰"写法：
 *   `name # domain.com`、`name (at) domain (dot) com`
 * 这在国内技术帖里很常见，不处理就会漏掉一半。
 */
export function extractEmails(text: string): string[] {
  const flat = text.replace(/\s+/g, " ");
  const direct = flat.match(EMAIL_RE) ?? [];

  const deobfuscated: string[] = [];
  // TLD 段允许 `com.cn` 这种多级（`[A-Za-z]{2,6}(?:\.[A-Za-z]{2,6})*`）——
  // 只写单段的话 `jobs (at) foo (dot) com.cn` 会被截成 jobs@foo.com（丢 .cn）
  const re =
    /([A-Za-z0-9._%+-]{2,})\s*(?:\(at\)|\[at\]|\{at\}|\s#\s|\s+at\s+)\s*([A-Za-z0-9-]{2,}(?:\.[A-Za-z0-9-]{2,})*)\s*(?:\(dot\)|\[dot\]|\{dot\}|\s+dot\s+|\.)\s*([A-Za-z]{2,6}(?:\.[A-Za-z]{2,6})*)/gi;
  for (const m of flat.matchAll(re)) deobfuscated.push(`${m[1]}@${m[2]}.${m[3]}`);

  const cleaned = [...direct, ...deobfuscated]
    .map((e) => e.toLowerCase().replace(/^[<(\[]+/, "").replace(/[.,;:)\]>】」，。；]+$/, ""))
    .filter((e) => e.length <= 80 && !e.includes("..") && !EMAIL_NOISE_RE.test(e));

  return [...new Set(cleaned)];
}

/** 一眼能认出是"投递入口"的链接特征（ATS / 招聘系统 / 表单） */
const APPLY_URL_HINT =
  /(mokahr|lagou|zhipin|boss|liepin|zhaopin|51job|feishu|forms\.|f\.wps|docs\.qq|beisen|italent|dayee|hotjob|talent\.|jobs?\.|careers?\.|hire\.|recruit|apply|ats\.|smartrecruiters|greenhouse|lever\.co|workable|ashby)/i;

/** 正文里那些明显不是投递入口的链接（图片、开源仓库等） */
const APPLY_URL_NOISE = /\.(png|jpe?g|gif|webp|svg|css|js|ico|zip|pdf)$/i;

export function extractApplyUrls(text: string): string[] {
  const urls = text.match(/https?:\/\/[^\s<>"'）)，,。；;、]+/g) ?? [];
  const cleaned = urls
    .map((u) => u.replace(/[.,;:)\]}】」》]+$/, ""))
    .filter((u) => !APPLY_URL_NOISE.test(u))
    .filter((u) => APPLY_URL_HINT.test(u));
  return [...new Set(cleaned)];
}

/**
 * 微信 / TG。刻意收窄：只认「明确标签 + 5~20 位 ID」，避免把正文里的普通英文单词当微信号。
 */
const WECHAT_RE =
  /(?:微信|weixin|wechat|vx|wx|v信|企微|加我)\s*(?:号|id)?\s*[:：]\s*([A-Za-z0-9_-]{5,20})/gi;
const TG_RE = /(?:telegram|tg)\s*[:：@]?\s*@?([A-Za-z0-9_]{5,32})/gi;

export function extractWechat(text: string): string[] {
  const out: string[] = [];
  for (const re of [WECHAT_RE, TG_RE]) {
    for (const m of text.matchAll(re)) out.push(m[1]);
  }
  return [...new Set(out)];
}

/**
 * 判定投递方式。优先级：邮箱 > 投递链接 > 微信。
 * 选邮箱优先，是因为它既合规又能被真正自动化；链接与微信同时保留，供人工使用。
 */
export function classifyApply(text: string): ApplyInfo {
  const email = extractEmails(text)[0] ?? null;
  const url = extractApplyUrls(text)[0] ?? null;
  const wechat = extractWechat(text)[0] ?? null;

  if (email) return { channel: "email", email, url, contact: wechat };
  if (url) return { channel: "link", email: null, url, contact: wechat };
  if (wechat) return { channel: "wechat", email: null, url: null, contact: wechat };
  return { channel: "unknown", email: null, url: null, contact: null };
}
