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
  const posRef = useRef({ x: 0, y: 0 });
  const drag = useRef({ active: false, moved: false, sx: 0, sy: 0, ox: 0, oy: 0 });

  useEffect(() => {
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
  }, []);

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    drag.current = {
      active: true,
      moved: false,
      sx: e.clientX,
      sy: e.clientY,
      ox: posRef.current.x,
      oy: posRef.current.y,
    };
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
        style={{ left: pos.x, top: pos.y, width: SIZE, height: SIZE }}
        aria-label="打开知行智能体（可拖动）"
        title="点击打开智能体 · 可拖动移动"
        className="pet-float group fixed z-40 flex cursor-grab touch-none items-center justify-center transition-transform hover:scale-110 active:cursor-grabbing"
      >
        <span className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-indigo-400/30" />
        <AgentMascot className="relative h-14 w-14 drop-shadow-lg" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="h-[82vh] w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex justify-end">
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg bg-white/90 px-3 py-1.5 text-sm font-medium text-zinc-700 shadow transition hover:bg-white dark:bg-zinc-800/90 dark:text-zinc-200"
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
