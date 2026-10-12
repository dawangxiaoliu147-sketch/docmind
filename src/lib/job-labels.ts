/**
 * 职位来源与投递方式的展示标签 —— 纯模块。
 *
 * 为什么单独一份：职位详情、投递看板、搜索结果几处都要显示同一套名字，
 * 各写一份必然漂移，所以收拢到这里。
 */

export const JOB_SOURCE_LABEL: Record<string, string> = {
  // 公开源
  v2ex: "V2EX",
  eleduck: "电鸭",
  rss: "RSS 源",
  // 手动/导入
  csv: "CSV 导入",
  manual: "手动添加",
  paste: "粘贴导入",
  // 平台（由「一键抓当前页」或书签脚本进来，不是自动爬的）
  boss: "BOSS直聘",
  zhilian: "智联招聘",
  liepin: "猎聘",
  "51job": "前程无忧",
  lagou: "拉勾",
  // 早期内置示例（假数据）
  demo: "内置示例",
};

export function jobSourceLabel(source: string): string {
  return JOB_SOURCE_LABEL[source] ?? source;
}

export type ChannelTone = "success" | "primary" | "muted";

export const APPLY_CHANNEL_META: Record<string, { label: string; tone: ChannelTone }> = {
  email: { label: "可邮件投递", tone: "success" },
  link: { label: "有投递链接", tone: "primary" },
  wechat: { label: "微信联系", tone: "muted" },
  unknown: { label: "未注明投递方式", tone: "muted" },
};

export function applyChannelMeta(channel: string | null | undefined) {
  return APPLY_CHANNEL_META[channel ?? "unknown"] ?? APPLY_CHANNEL_META.unknown;
}
