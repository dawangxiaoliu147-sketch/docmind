"use client";

import { useShortcutHelp } from "@/components/shortcuts";

/**
 * 导航栏的「?」入口。
 *
 * 快捷键面板原来只能靠按 ? 才发现 —— 等于没有门。把门放到看得见的地方，
 * 顺带给「快捷键」那条引导一个精确的小锚点（比框住整条导航栏合适得多）。
 *
 * 没挂 Provider 的页面（公开页 /ui 之外）不渲染，免得留一个点了没反应的键。
 */
export function ShortcutHelpButton() {
  const toggle = useShortcutHelp();
  if (!toggle) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="快捷键"
      title="快捷键（?）"
      data-tour="shortcut-help"
      className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-[13px] font-semibold text-muted-fg transition hover:bg-muted hover:text-fg"
    >
      ?
    </button>
  );
}
