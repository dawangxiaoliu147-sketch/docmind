import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

/** 卡片：发丝边 + 玻璃面 + 内顶高光（§3 质感 #2），圆角克制在 8px（§5） */
export function Card({
  className,
  hover,
  pad,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  /** 可点击卡片：hover 上浮 3px + 阴影加深 */
  hover?: boolean;
  /** 直接带 1.25rem 内边距 */
  pad?: boolean;
}) {
  return (
    <div
      className={cn("card ui-reveal", hover && "card-hover", pad && "card-pad", className)}
      {...rest}
    />
  );
}

/** 卡片网格：子元素依次入场（.ui-cascade 会给每个子元素递增 --d，被里面的 .ui-reveal 继承） */
export function CardGrid({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card-grid ui-cascade", className)} {...rest} />;
}

export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card-head", className)} {...rest} />;
}

export function CardTitle({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLHeadingElement> & { children?: ReactNode }) {
  return (
    <h3 className={cn("card-title", className)} {...rest}>
      {children}
    </h3>
  );
}

export function CardDesc({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("card-desc", className)} {...rest} />;
}

export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card-body", className)} {...rest} />;
}

export function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card-foot", className)} {...rest} />;
}

/** 面板 / 玻璃层级（§9）：panel 页面主体 · glass 弹层浮卡 · glass-strong 强毛玻璃 */
export function Panel({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("panel ui-reveal", className)} {...rest} />;
}

export function Glass({ className, strong, ...rest }: HTMLAttributes<HTMLDivElement> & { strong?: boolean }) {
  return <div className={cn(strong ? "glass-strong" : "glass", "ui-reveal", className)} {...rest} />;
}

/** 列表行：hover 主色描边 + 轻微上浮 */
export function Row({
  className,
  static: isStatic,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { static?: boolean }) {
  return <div className={cn("ui-row", isStatic && "ui-row-static", className)} {...rest} />;
}

/** 重点签名：左侧主色竖杠 */
export function Rail({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ui-rail", className)} {...rest} />;
}
