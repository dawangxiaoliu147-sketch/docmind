"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 滚入视口时把数字从 0 数到目标值。
 *
 * 只用在少数几个"叙事性"的数字上（知行岛的成长分、控制台的知识库数）——
 * 数字滚动对**可读性是有代价的**：动画期间读不出准确值。铺开用会变成一个缺点。
 *
 * 两条安全约定：
 *  1. **初始渲染就是真实值**，不是 0。否则没 JS、或者观察器没触发时，用户会看到一个错的 0。
 *      只有确认要动画了（元素进入视口）才先归零再往上数 —— 那一瞬间的闪动约 16ms，看不出来。
 *  2. **1.5 秒兜底**：万一观察器没回调（隐藏标签页、布局异常），直接把真实值写上去。
 *      宁可不动画，也不能显示错数字。
 */
export function CountUp({
  value,
  duration = 720,
  className,
}: {
  value: number;
  /** 动画时长（毫秒） */
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- 动画与兜底都只能由 effect 驱动：
       渲染期读 window.matchMedia / IntersectionObserver 会 hydration 不一致；
       这里每次 setShown 都来自"外部系统的事件"（观察器回调 / rAF / 定时器），
       不是渲染期可推导的值。 */
    const el = ref.current;
    if (!el) return;

    // 尊重 prefers-reduced-motion：不数，直接显示
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      return;
    }

    let raf = 0;
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        // ease-out cubic：开头快、结尾稳，读起来像"数据落定"
        setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      setShown(0);
      raf = requestAnimationFrame(step);
    };

    // 兜底：无论如何 1.5s 后必须是真实值
    const fallback = window.setTimeout(() => {
      if (!started) setShown(value);
    }, 1500);

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          window.clearTimeout(fallback);
          start();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
      cancelAnimationFrame(raf);
    };
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {shown}
    </span>
  );
}
