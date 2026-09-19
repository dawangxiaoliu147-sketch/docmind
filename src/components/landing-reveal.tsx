"use client";

import { useEffect } from "react";

/**
 * 落地页的滚动 reveal 装配器。
 *
 * 两个关键点（都是踩过坑才知道的）：
 * 1. 首屏元素必须**立即点亮**，不能只靠 IntersectionObserver 回调 ——
 *    否则硬刷新后用户会看到一片空白，等 IO 触发才出现。
 * 2. rootMargin 必须**向外扩张**（+12%），不能用负值裁切，
 *    否则刚好卡在视口边缘的元素永远不亮。
 *
 * 同时尊重 prefers-reduced-motion：直接全部点亮，不做动画。
 */
export function LandingReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".zx-reveal"));
    if (els.length === 0) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }

    // 首屏（任一像素露在视口内）立即点亮，带各自的 --d 错峰
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const timers: number[] = [];
    els.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.85 && r.bottom > 0) {
        const delay = parseFloat(el.style.getPropertyValue("--d") || "0") * 1000;
        timers.push(window.setTimeout(() => el.classList.add("in"), delay));
      }
    });

    // 其余交给 IntersectionObserver
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px 12% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      io.disconnect();
    };
  }, []);

  return null;
}
