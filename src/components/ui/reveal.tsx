"use client";

import { useEffect, useRef, type CSSProperties, type HTMLAttributes } from "react";
import { cn } from "./cn";

/**
 * 滚动 reveal（§6 #1）
 *
 * 关键（L4 沉淀）：首屏元素必须在**首帧立即点亮**，不能只靠 IntersectionObserver 回调，
 * 否则刷新页面时用户会看到"内容一闪就没了"。所以脚本先做一次视口判定立即 in，
 * 剩下的才交给 IO，并且 rootMargin 是**扩张 +12%** 而不是负值裁切。
 * reduced-motion / 无 IO 时全部直接点亮，内容绝不永久隐藏。
 */
export function Reveal({
  delay = 0,
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  /** 错峰延迟，秒（0 / .05 / .1 / .15 / .2） */
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      el.classList.add("in");
      return;
    }

    // —— 首屏立即 in（核心）——
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const r = el.getBoundingClientRect();
    if (r.top < vh * 0.85 && r.bottom > 0) {
      const t = window.setTimeout(() => el.classList.add("in"), Math.max(0, delay) * 1000);
      return () => window.clearTimeout(t);
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.06, rootMargin: "0px 0px 12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={cn("ui-reveal", className)}
      style={{ "--d": `${delay}s` } as CSSProperties}
      {...rest}
    >
      {children}
    </div>
  );
}
