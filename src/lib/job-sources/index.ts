import { v2exSource } from "./v2ex";
import { rssSource } from "./rss";
import type { JobSource } from "./types";

/**
 * 职位源注册表。
 * 加一个新源 = 新建一个文件实现 JobSource，然后加到这个数组里（并在 UI 上说明它的来源与限制）。
 *
 * ⚠️ 有意**没有**的源：BOSS直聘 / 智联 / 猎聘 / 前程无忧 / 拉勾。
 *    它们不提供公开接口，抓取违反平台协议、有反爬与封号风险，还涉及数据合规问题。
 *    真要覆盖这些渠道，正确做法是「你自己在平台上操作 + 本工具生成材料并记录投递」，
 *    而不是让程序去替你登录和批量投递。
 */
export const JOB_SOURCES: JobSource[] = [v2exSource, rssSource];

export function getSource(id: string): JobSource | undefined {
  return JOB_SOURCES.find((s) => s.id === id);
}

/** 给 UI 用的源清单（不含 fetch 函数，可安全序列化） */
export function listSources() {
  return JOB_SOURCES.map((s) => ({
    id: s.id,
    name: s.name,
    homepage: s.homepage,
    kind: s.kind,
    note: s.note,
    enabledByDefault: s.enabledByDefault,
  }));
}

export type { JobSource, RawJob } from "./types";
