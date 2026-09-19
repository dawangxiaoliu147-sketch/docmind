import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * 主题化 tooltip（§6 #7）—— 替代原生 title。
 * 纯 CSS 实现（data-tip 属性 + ::after），服务端组件可直接用。
 *
 * 注意：本组件用 ::after 画气泡，所以不要和同样占用 ::after 的 .btn-pill 套在同一个元素上；
 * 包在 .btn-icon 外层是安全的。
 */
export function Tooltip({
  label,
  side = "top",
  className,
  children,
}: {
  label: string;
  side?: "top" | "bottom" | "right";
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={cn("tip", className)} data-tip={label} data-tip-side={side}>
      {children}
    </span>
  );
}

/** 纯图标按钮：必须有 aria-label + 主题化 tooltip，不要用原生 title（§8） */
export function IconButton({
  label,
  side,
  className,
  children,
  onClick,
  disabled,
}: {
  label: string;
  side?: "top" | "bottom" | "right";
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <Tooltip label={label} side={side}>
      <button
        type="button"
        aria-label={label}
        className={cn("btn btn-icon btn-ghost", className)}
        onClick={onClick}
        disabled={disabled}
      >
        {children}
      </button>
    </Tooltip>
  );
}
