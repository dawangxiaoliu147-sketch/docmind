"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "./cn";

export interface TabItem {
  id: string;
  label: ReactNode;
  content?: ReactNode;
  disabled?: boolean;
}

/**
 * 标签页 / 分段控件（§7：模式切换用 segmented，视图切换用 tabline）
 * variant="segmented" 药丸底分段 · variant="line" 下划线式页面级导航
 */
export function Tabs({
  items,
  defaultValue,
  variant = "segmented",
  className,
  panelClassName,
}: {
  items: TabItem[];
  defaultValue?: string;
  variant?: "segmented" | "line";
  className?: string;
  panelClassName?: string;
}) {
  const [active, setActive] = useState(defaultValue ?? items[0]?.id ?? "");
  const uid = useId();
  const current = items.find((i) => i.id === active) ?? items[0];

  return (
    <div className={cn("min-w-0", className)}>
      <div className={cn(variant === "line" ? "tabline" : "tablist")} role="tablist">
        {items.map((item) => {
          const selected = item.id === current?.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`${uid}-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`${uid}-panel-${item.id}`}
              disabled={item.disabled}
              tabIndex={selected ? 0 : -1}
              className="tab"
              onClick={() => setActive(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {current?.content !== undefined ? (
        <div
          className={cn("mt-4 min-w-0", panelClassName)}
          role="tabpanel"
          id={`${uid}-panel-${current.id}`}
          aria-labelledby={`${uid}-tab-${current.id}`}
        >
          {current.content}
        </div>
      ) : null}
    </div>
  );
}
