"use client";

import { useEffect } from "react";

/**
 * 全局滚动滑入观察器：挂在根布局一次，任何带 `ui-reveal` 的元素（含服务端组件渲染出来的）
 * 滚入视口就滑入，不需要为每个卡片包一个客户端组件。
 * 首屏元素必须首帧立即点亮，不能等 IntersectionObserver 回调，否则刷新时会看到内容一闪就没了。
 * `--d` 必须用 getComputedStyle 读：错开的延迟写在 CSS 上并继承到卡片本身，el.style 只能读行内样式。
 * MutationObserver 兜住异步渲染的内容；prefers-reduced-motion 或无 IO 时全部直接点亮，内容绝不永久隐藏。
 */
export function RevealObserver() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasIO = "IntersectionObserver" in window;

    const io = hasIO
      ? new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              if (e.isIntersecting) {
                e.target.classList.add("in");
                io?.unobserve(e.target);
              }
            }
          },
          { threshold: 0.06, rootMargin: "0px 0px 12% 0px" },
        )
      : null;

    /**
     * 解析 `--d`。必须同时认 `0.06s` 和 `60ms`：自定义属性的计算值会被规范化，`0.06s` 读出来可能是
     * `"60ms"`，而 parseFloat("60ms") === 60 —— 当成秒用就是 60 秒的延迟，卡片根本不会显示。
     */
    function parseDelay(raw: string): number {
      const s = (raw ?? "").trim();
      if (!s) return 0;
      const n = parseFloat(s);
      if (!Number.isFinite(n)) return 0;
      if (/ms$/.test(s)) return n / 1000;
      return n; // "0.06s" / "0.06" 都按秒
    }

    function revealWithDelay(el: Element) {
      const d = parseDelay(getComputedStyle(el).getPropertyValue("--d"));
      if (d > 0) window.setTimeout(() => el.classList.add("in"), d * 1000);
      else el.classList.add("in");
    }

    function scan() {
      const els = document.querySelectorAll(".ui-reveal:not(.in)");
      if (!els.length) return;
      if (reduce || !io) {
        els.forEach((el) => el.classList.add("in"));
        return;
      }
      const vh = window.innerHeight || document.documentElement.clientHeight;
      els.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.85 && r.bottom > 0) revealWithDelay(el);
        else io.observe(el);
      });
    }

    scan();

    // 向 layout.tsx 那段内联脚本报到：观察器确实起来了，它就不必启动 1.5s 的保守兜底
    (window as unknown as { __uiRevealReady?: boolean }).__uiRevealReady = true;

    // 看门狗：只要元素已在视口里却仍是隐形的就强制点亮（延迟算错 / 观察器漏掉 / 异步内容都可能）
    const watchdog = window.setInterval(() => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      document.querySelectorAll<HTMLElement>(".ui-reveal:not(.in)").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < vh && r.bottom > 0 && r.height > 0) el.classList.add("in");
      });
    }, 1200);

    let timer = 0;
    const mo = new MutationObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(scan, 120);
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io?.disconnect();
      mo.disconnect();
      window.clearTimeout(timer);
      window.clearInterval(watchdog);
    };
  }, []);

  /**
   * 卡片光标光斑：把鼠标位置写进当前卡片的 --mx/--my，CSS 用 radial-gradient 渲染那团柔光。
   *
   * 用**一个委托监听**而不是给每张卡各挂一个 —— 控制台一屏就有几十张卡，
   * 逐元素绑定既浪费又要在 DOM 变动时重新绑定。坐标写进自定义属性，不触发 React 重渲染。
   *
   * 用 rAF 节流：pointermove 每秒能触发上百次，直接写样式会让主线程忙于样式重算。
   */
  useEffect(() => {
    let raf = 0;
    let pending: { el: HTMLElement; x: number; y: number } | null = null;

    const onMove = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      const card = target?.closest?.(".card") as HTMLElement | null;
      if (!card) return;
      pending = { el: card, x: e.clientX, y: e.clientY };
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        if (!pending) return;
        const r = pending.el.getBoundingClientRect();
        pending.el.style.setProperty("--mx", `${pending.x - r.left}px`);
        pending.el.style.setProperty("--my", `${pending.y - r.top}px`);
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
