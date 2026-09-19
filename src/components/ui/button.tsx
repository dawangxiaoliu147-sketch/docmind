import type { ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

/**
 * 按钮（§5 尺寸 / §6 状态 / §7 按钮规格）
 * 变体：default(=primary) / outline / secondary / ghost / destructive / link
 * 尺寸：default 32 · sm 28 · lg 36 · icon 32（icon 另有 icon-xs/icon-sm/icon-lg）
 * 四态齐备：hover / focus-visible / active（下移 1px，不跳布局）/ disabled
 */
export type ButtonVariant =
  | "default"
  | "primary"
  | "outline"
  | "secondary"
  | "ghost"
  | "destructive"
  | "link";

export type ButtonSize =
  | "xs"
  | "sm"
  | "default"
  | "lg"
  | "icon"
  | "icon-xs"
  | "icon-sm"
  | "icon-lg";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  default: "btn-primary",
  primary: "btn-primary",
  outline: "btn-outline",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  destructive: "btn-destructive",
  link: "btn-link",
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  xs: "btn-xs",
  sm: "btn-sm",
  default: "",
  lg: "btn-lg",
  icon: "btn-icon",
  "icon-xs": "btn-icon btn-xs",
  "icon-sm": "btn-icon btn-sm",
  "icon-lg": "btn-icon btn-lg",
};

/** 给 <Link> / <a> 这类非 button 元素复用同一套按钮外观 */
export function buttonClass(options?: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** 胶囊主 CTA（提交/创建这类唯一 commit 动作）：高光扫过 + 按下缩放 */
  pill?: boolean;
  className?: string;
}): string {
  const { variant = "default", size = "default", pill, className } = options ?? {};
  return cn("btn", VARIANT_CLASS[variant], SIZE_CLASS[size], pill && "btn-pill", className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  pill?: boolean;
  /** 载入态：按钮内出现边框转圈，宽度不变、不跳布局 */
  loading?: boolean;
}

export function Button({
  variant = "default",
  size = "default",
  pill,
  loading,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass({ variant, size, pill, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className="btn-spinner" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
