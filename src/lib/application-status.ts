/**
 * 投递记录的状态机与文案 —— 纯模块，零依赖、无 server-only。
 *
 * 为什么单独一份：状态/渠道标签**服务端和客户端都要用**（看板要显示、按钮要排序），
 * 而 `applications.ts` 那边有 `import "server-only"`，客户端组件导入它会直接报错。
 * 所以常量与纯函数放这里，那边只放数据库操作。
 */

export const APP_STATUSES = [
  "draft",
  "sent",
  "viewed",
  "replied",
  "interview",
  "offer",
  "rejected",
  "closed",
] as const;
export type AppStatus = (typeof APP_STATUSES)[number];

export const STATUS_LABEL: Record<AppStatus, string> = {
  draft: "准备中",
  sent: "已投递",
  viewed: "已读",
  replied: "有回复",
  interview: "面试中",
  offer: "已录用",
  rejected: "未通过",
  closed: "已关闭",
};

/** 看板顺序：漏斗从早到晚 + 两个终态放最后 */
export const STATUS_ORDER: AppStatus[] = [...APP_STATUSES];

/** 进入这几个状态就认为"已经投出去了"（用来补 appliedAt） */
export const APPLIED_STATUSES: AppStatus[] = ["sent", "viewed", "replied", "interview", "offer", "rejected"];

export const CHANNELS = [
  "email",
  "boss",
  "zhilian",
  "liepin",
  "51job",
  "lagou",
  "refer",
  "other",
] as const;
export type Channel = (typeof CHANNELS)[number];

export const CHANNEL_LABEL: Record<string, string> = {
  email: "邮件投递",
  boss: "BOSS直聘",
  zhilian: "智联招聘",
  liepin: "猎聘",
  "51job": "前程无忧",
  lagou: "拉勾",
  refer: "内推",
  other: "其他",
};

export function isStatus(v: unknown): v is AppStatus {
  return typeof v === "string" && (APP_STATUSES as readonly string[]).includes(v);
}

export function isChannel(v: unknown): v is Channel {
  return typeof v === "string" && (CHANNELS as readonly string[]).includes(v);
}

export type TimelineEntry = {
  /** ISO 时间 */
  at: string;
  from?: string;
  to?: string;
  note?: string;
};

/** 容错解析时间线：库里存的是 JSON 字符串，脏数据不能让页面崩 */
export function parseTimeline(json: string | null | undefined): TimelineEntry[] {
  try {
    const arr = JSON.parse(String(json ?? "[]"));
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (e) => e && typeof e === "object" && typeof (e as TimelineEntry).at === "string",
    ) as TimelineEntry[];
  } catch {
    return [];
  }
}

/** 追加一条时间线，只保留最近 50 条 */
export function appendTimeline(json: string | null | undefined, entry: TimelineEntry): string {
  const arr = parseTimeline(json);
  arr.push(entry);
  return JSON.stringify(arr.slice(-50));
}
