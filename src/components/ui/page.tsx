import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";
import { ScenicBackdrop } from "./scenic-backdrop";

/**
 * 独立页壳：提供场景底色 + 可选场景背板 + 可选的场景横穿渐变。
 * 应用内页已经有 (app)/layout.tsx 的 .app-shell，只有 /ui、/about、/s/[id] 这类独立页需要它。
 */
export function PageShell({
  className,
  sceneFade = true,
  grain,
  scenic,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  /** 场景切换时整页 380ms 横穿渐变（只动颜色族，不动布局） */
  sceneFade?: boolean;
  grain?: boolean;
  /** 挂整页场景背板（含暗过渡） */
  scenic?: boolean;
}) {
  return (
    <div
      className={cn("ui-shell", sceneFade && "ui-scene-fade", scenic && "has-scenic", className)}
      {...rest}
    >
      {scenic ? <ScenicBackdrop veil="strong" grain={false} /> : null}
      {children}
      {grain ? <div className="ui-grain" aria-hidden="true" /> : null}
    </div>
  );
}

export function PageBody({
  className,
  size = "default",
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { size?: "default" | "narrow" | "wide" }) {
  return (
    <div
      className={cn(
        "ui-page",
        size === "narrow" && "ui-narrow",
        size === "wide" && "ui-wide",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/** 页头：眉标(mono 大写 + 主色短横) + 大标题 + 副标题 + 右侧操作（§9） */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("ui-header ui-reveal", className)} data-reveal="left">
      <div className="ui-header-main">
        {eyebrow ? <p className="ui-eyebrow">{eyebrow}</p> : null}
        <h1 className="ui-title">{title}</h1>
        {subtitle ? <p className="ui-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="ui-actions">{actions}</div> : null}
    </header>
  );
}

/** 区块小标题：左标题右说明（§9 section-heading） */
export function Section({
  title,
  extra,
  actions,
  className,
  children,
  ...rest
}: {
  title?: ReactNode;
  extra?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "title">) {
  return (
    <section className={cn("min-w-0", className)} {...rest}>
      {title || extra || actions ? (
        <div className="ui-section ui-reveal">
          <h2 className="ui-section-title">{title}</h2>
          {extra ? <span className="ui-section-extra">{extra}</span> : null}
          {actions ? <div className="ui-actions">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/**
 * 页面主干的纵向节奏。
 *
 * `enter` 默认**关闭**：`.ui-enter` 用的是 CSS animation，而动画会盖过 transition ——
 * 如果它和元素的 `.ui-reveal` 同时作用，滚动滑入就被页载动画吃掉了。
 * 现在统一交给全局 reveal 观察器（首屏元素首帧立即点亮）。需要页载瀑布时再显式开 enter。
 */
export function Stack({
  className,
  enter = false,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { enter?: boolean }) {
  return (
    <div className={cn("ui-stack", enter && "ui-enter", className)} {...rest}>
      {children}
    </div>
  );
}
