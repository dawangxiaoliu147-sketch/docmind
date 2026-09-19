import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export type ChipTone = "muted" | "primary" | "red" | "success" | "outline";

const CHIP_TONE: Record<ChipTone, string> = {
  muted: "",
  primary: "chip-primary",
  red: "chip-red",
  success: "chip-success",
  outline: "chip-outline",
};

/** 状态芯片：24px 药丸，主色只以混色点缀（§7 status chips） */
export function Chip({
  tone = "muted",
  icon,
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tone?: ChipTone; icon?: ReactNode }) {
  return (
    <span className={cn("chip", CHIP_TONE[tone], className)} {...rest}>
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      {children}
    </span>
  );
}

/**
 * 徽章（L3 铁律）：主色**实心**底 + 紧凑圆角方 8px。
 * 不要空心描边、不要 999px 胶囊、不要夸张字距 —— 手感对标主按钮。
 */
export function Badge({
  className,
  muted,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { muted?: boolean }) {
  return <span className={cn("badge", muted && "badge-muted", className)} {...rest} />;
}

/**
 * 图标瓦片：主色系描边 + 主色字符。
 * L2 铁律：里面只放单调 Unicode（↯ ◎ ✦ ⬢ ≋ ◈ ⊞ ⊡ ⋯）或 SVG，
 * 绝不放彩色 emoji（⚡❤️🌞✅ 都会自带颜色、不服从 CSS color）。
 */
export function IconBox({
  className,
  size = "default",
  children,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { size?: "sm" | "default" | "lg" }) {
  return (
    <span
      className={cn(
        "ui-iconbox",
        size === "sm" && "ui-iconbox-sm",
        size === "lg" && "ui-iconbox-lg",
        className,
      )}
      aria-hidden="true"
      {...rest}
    >
      {children}
    </span>
  );
}
