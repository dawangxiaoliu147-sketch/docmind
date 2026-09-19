import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export type AlertTone = "default" | "error" | "info";

const ALERT_TONE: Record<AlertTone, string> = {
  default: "",
  error: "alert-error",
  info: "alert-info",
};

export function Alert({
  tone = "default",
  icon,
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { tone?: AlertTone; icon?: ReactNode }) {
  return (
    <div className={cn("alert", ALERT_TONE[tone], className)} role={tone === "error" ? "alert" : undefined} {...rest}>
      {icon ? (
        <span className="alert-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** 空态：虚线框 + 居中说明 + 可选行动按钮（§9） */
export function Empty({
  icon,
  title,
  desc,
  action,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  desc?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("empty ui-reveal", className)}>
      {icon ? (
        <span className="empty-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <p className="empty-title">{title}</p>
      {desc ? <p className="empty-desc">{desc}</p> : null}
      {action ? <div className="empty-action">{action}</div> : null}
    </div>
  );
}

export function Skeleton({
  className,
  block,
}: {
  className?: string;
  /** 整块骨架（卡片位图）而不是一行文字 */
  block?: boolean;
}) {
  return (
    <div
      className={cn("skeleton", block ? "skeleton-block" : "skeleton-text", className)}
      aria-hidden="true"
    />
  );
}

/** 骨架卡片：列表/网格加载中的占位 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("card card-pad", className)}>
      <Skeleton className="w-1/3" />
      <div className="mt-3">
        <Skeleton className="w-full" />
      </div>
      <div className="mt-2">
        <Skeleton className="w-2/3" />
      </div>
    </div>
  );
}
