"use client";

import { useEffect, useRef, useState } from "react";
import { AgentPanel } from "@/components/agent-panel";
import { AgentMascot } from "@/components/agent-mascot";

const SIZE = 56; // 图标直径
const PAD = 8;

// 可拖动的浮动智能体图标：点击打开智能体面板，拖动可移动位置（记住位置）
export function FloatingAgent() {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);
  const [dragging, setDragging] = useState(false);
  /** 是否让它自己走动（桌宠的自动漫游）。用户可关掉，一直停在原地。 */
  const [moving, setMoving] = useState(true);
  const posRef = useRef({ x: 0, y: 0 });
  const drag = useRef({ active: false, moved: false, sx: 0, sy: 0, ox: 0, oy: 0 });

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- window 尺寸与 localStorage 只有客户端可读，
       渲染期读会 hydration 不一致，只能在挂载后测量并恢复上次位置。 */
    const w = window.innerWidth;
    const h = window.innerHeight;
    let init = { x: w - SIZE - 24, y: h - SIZE - 24 };
    const saved = localStorage.getItem("agentFabPos");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (typeof p?.x === "number" && typeof p?.y === "number") {
          init = {
            x: Math.min(Math.max(p.x, PAD), w - SIZE - PAD),
            y: Math.min(Math.max(p.y, PAD), h - SIZE - PAD),
          };
        }
      } catch {
        // 忽略
      }
    }
    setPos(init);
    posRef.current = init;
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // 桌面宠物：自己不定期走到屏幕上的随机位置（面板打开/拖动/关掉漫游时暂停）
  useEffect(() => {
    if (!ready || open || !moving) return;
    const id = window.setInterval(() => {
      if (drag.current.active) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const x = PAD + Math.random() * Math.max(w - SIZE - PAD * 2, 1);
      const y = PAD + Math.random() * Math.max(h - SIZE - PAD * 2, 1);
      posRef.current = { x, y };
      setPos({ x, y });
    }, 7000);
    return () => window.clearInterval(id);
  }, [ready, open, moving]);

  /**
   * 漫游开关的读写。
   * 读放在挂载后（localStorage 只有客户端可读，渲染期读会 hydration 不一致）；
   * 默认开，所以只有明确存过 "0" 才认为是关。
   */
  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- 见上 */
    setMoving(localStorage.getItem("agentPetMove") !== "0");
  }, []);

  function toggleMove() {
    setMoving((v) => {
      const next = !v;
      localStorage.setItem("agentPetMove", next ? "1" : "0");
      return next;
    });
  }

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    drag.current = {
      active: true,
      moved: false,
      sx: e.clientX,
      sy: e.clientY,
      ox: posRef.current.x,
      oy: posRef.current.y,
    };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.sx;
    const dy = e.clientY - drag.current.sy;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) drag.current.moved = true;
    const x = Math.min(Math.max(drag.current.ox + dx, PAD), window.innerWidth - SIZE - PAD);
    const y = Math.min(Math.max(drag.current.oy + dy, PAD), window.innerHeight - SIZE - PAD);
    posRef.current = { x, y };
    setPos({ x, y });
  }

  function onPointerUp() {
    if (!drag.current.active) return;
    drag.current.active = false;
    setDragging(false);
    if (drag.current.moved) {
      localStorage.setItem("agentFabPos", JSON.stringify(posRef.current));
    } else {
      setOpen(true);
    }
  }

  if (!ready) return null;

  return (
    <>
      <button
        type="button"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          left: pos.x,
          top: pos.y,
          width: SIZE,
          height: SIZE,
          transition: dragging ? "none" : "left 2.5s ease-in-out, top 2.5s ease-in-out",
        }}
        aria-label="打开知行智能体（可拖动）"
        title="点击打开智能体 · 可拖动 · 面板里可让它停下"
        className="pet-float group fixed z-40 flex cursor-grab touch-none items-center justify-center transition-transform hover:scale-110 active:cursor-grabbing"
      >
        <span className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-primary/30" />
        <AgentMascot className="relative h-14 w-14 drop-shadow-lg" />
      </button>

      {open && (
        <div
          className="ui-overlay"
          onClick={() => setOpen(false)}
        >
          <div
            className="h-[82vh] w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={toggleMove}
                aria-pressed={!moving}
                title={moving ? "让它停在原地" : "让它自己走动"}
                className="btn btn-secondary btn-sm"
              >
                {moving ? "让它停下" : "让它走动"}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="btn btn-secondary btn-sm"
              >
                ✕ 关闭
              </button>
            </div>
            <AgentPanel />
          </div>
        </div>
      )}
    </>
  );
}
