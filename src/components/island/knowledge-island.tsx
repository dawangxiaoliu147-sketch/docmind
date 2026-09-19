"use client";

import { useCallback, useEffect, useId, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  buildIsland,
  project,
  rotateCoords,
  TILE_W,
  TILE_H,
  type IslandStats,
  type IslandTile,
  type BuildingKind,
} from "./island-model";
import { cn } from "@/components/ui";

/**
 * 知行岛 · 渲染层（2D 等距 SVG）：零外部依赖的默认视图，读场景令牌，换场景整座岛跟着换肤。
 * 四视角转的是逻辑网格坐标（rotateCoords），投影、包围盒、建筑热点全部自动重算。
 * 建筑与地块的命中区用上层的 HTML 元素（按钮/说明卡）而不是 SVG 命中测试 —— 键盘可达、能用主题化样式。
 */

const SEEN_KEY = "island_seen_v1";

const FACE = {
  grass: {
    top: "color-mix(in srgb, var(--theme-primary) 26%, var(--theme-background))",
    left: "color-mix(in srgb, var(--theme-primary) 13%, var(--theme-background))",
    right: "color-mix(in srgb, var(--theme-primary) 6%, var(--theme-background))",
  },
  rock: {
    top: "color-mix(in srgb, var(--theme-foreground) 24%, var(--theme-background))",
    left: "color-mix(in srgb, var(--theme-foreground) 13%, var(--theme-background))",
    right: "color-mix(in srgb, var(--theme-foreground) 7%, var(--theme-background))",
  },
  sand: {
    top: "color-mix(in srgb, var(--theme-primary) 46%, var(--theme-background))",
    left: "color-mix(in srgb, var(--theme-primary) 26%, var(--theme-background))",
    right: "color-mix(in srgb, var(--theme-primary) 14%, var(--theme-background))",
  },
} as const;

export type IslandDoc = { title: string; kb: string };

function Tile({ t, x, y }: { t: IslandTile; x: number; y: number }) {
  const f = FACE[t.kind];
  const hw = TILE_W / 2;
  const hh = TILE_H / 2;
  const top = y - t.h;
  return (
    <>
      <polygon points={`${x - hw},${top} ${x},${top + hh} ${x},${y + hh} ${x - hw},${y}`} fill={f.left} />
      <polygon points={`${x + hw},${top} ${x},${top + hh} ${x},${y + hh} ${x + hw},${y}`} fill={f.right} />
      <polygon points={`${x},${top - hh} ${x + hw},${top} ${x},${top + hh} ${x - hw},${top}`} fill={f.top} />
    </>
  );
}

function Deco({ t, x, y }: { t: IslandTile; x: number; y: number }) {
  const top = y - t.h - TILE_H / 2;
  const trunk = "color-mix(in srgb, var(--theme-background) 70%, #000)";
  const leaf = "color-mix(in srgb, var(--theme-primary) 62%, var(--theme-background))";
  const rock = "color-mix(in srgb, var(--theme-foreground) 34%, var(--theme-background))";

  if (t.deco === 1) {
    const s = 0.85 + t.decoV * 0.16;
    return (
      <g opacity="0.95">
        <rect x={x - 1.1} y={top - 8 * s} width="2.2" height={9 * s} fill={trunk} />
        <polygon points={`${x},${top - 22 * s} ${x + 6.4 * s},${top - 7 * s} ${x - 6.4 * s},${top - 7 * s}`} fill={leaf} />
        <polygon
          points={`${x},${top - 17 * s} ${x + 5.2 * s},${top - 4 * s} ${x - 5.2 * s},${top - 4 * s}`}
          fill="color-mix(in srgb, var(--theme-primary) 48%, var(--theme-background))"
        />
      </g>
    );
  }
  if (t.deco === 2) {
    return (
      <polygon
        points={`${x - 4},${top} ${x + 3.4},${top - 2} ${x + 4.4},${top - 6} ${x},${top - 8} ${x - 4.6},${top - 5}`}
        fill={rock}
      />
    );
  }
  return (
    <g fill={leaf} opacity="0.9">
      <path d={`M${x} ${top} L${x - 5} ${top - 8} L${x - 1.4} ${top - 7.4} Z`} />
      <path d={`M${x} ${top} L${x} ${top - 10} L${x + 1.5} ${top - 7.4} Z`} />
      <path d={`M${x} ${top} L${x + 5} ${top - 7} L${x + 1.4} ${top - 6.6} Z`} />
    </g>
  );
}

function Building({ kind, x, y }: { kind: BuildingKind; x: number; y: number }) {
  const wall = "color-mix(in srgb, var(--theme-foreground) 88%, var(--theme-background))";
  const wall2 = "color-mix(in srgb, var(--theme-foreground) 62%, var(--theme-background))";
  const roof = "var(--theme-primary)";
  const dark = "color-mix(in srgb, var(--theme-background) 60%, #000)";

  switch (kind) {
    case "library":
      return (
        <g>
          <rect x={x - 13} y={y - 20} width="26" height="20" rx="1.5" fill={wall} />
          <polygon points={`${x - 17},${y - 20} ${x},${y - 34} ${x + 17},${y - 20}`} fill={roof} />
          <rect x={x - 3} y={y - 13} width="6" height="13" fill={dark} />
          <rect x={x - 10} y={y - 16} width="4" height="6" fill={wall2} />
          <rect x={x + 6} y={y - 16} width="4" height="6" fill={wall2} />
        </g>
      );
    case "lighthouse":
      return (
        <g>
          <polygon points={`${x - 6},${y} ${x + 6},${y} ${x + 3.4},${y - 30} ${x - 3.4},${y - 30}`} fill={wall} />
          <rect x={x - 4} y={y - 34} width="8" height="5" fill={dark} />
          <circle cx={x} cy={y - 38} r="4.6" fill={roof} />
          <polygon points={`${x},${y - 38} ${x + 30},${y - 48} ${x + 30},${y - 30}`} fill={roof} opacity="0.18" />
          <polygon points={`${x},${y - 38} ${x - 30},${y - 48} ${x - 30},${y - 30}`} fill={roof} opacity="0.12" />
        </g>
      );
    case "workshop":
      return (
        <g>
          <rect x={x - 12} y={y - 17} width="24" height="17" rx="1.5" fill={wall} />
          <polygon points={`${x - 15},${y - 17} ${x - 5},${y - 27} ${x + 6},${y - 17}`} fill={roof} />
          <rect x={x + 5} y={y - 30} width="4" height="12" fill={wall2} />
          <rect x={x - 8} y={y - 12} width="7" height="12" fill={dark} />
        </g>
      );
    case "harbor":
      return (
        <g>
          <rect x={x - 18} y={y - 5} width="30" height="4" rx="1" fill={wall2} />
          <rect x={x - 16} y={y - 5} width="3" height="9" fill={dark} />
          <rect x={x + 8} y={y - 5} width="3" height="9" fill={dark} />
          <path d={`M${x + 4} ${y - 7} q9 3 0 10 z`} fill={roof} />
          <rect x={x + 3} y={y - 16} width="1.6" height="9" fill={dark} />
        </g>
      );
    case "camp":
      return (
        <g>
          <polygon points={`${x},${y - 24} ${x + 14},${y} ${x - 14},${y}`} fill={roof} />
          <polygon points={`${x},${y - 24} ${x + 14},${y} ${x},${y}`} fill={dark} opacity="0.35" />
          <circle cx={x + 18} cy={y - 3} r="3" fill={roof} opacity="0.8" />
        </g>
      );
    default:
      return (
        <g>
          <rect x={x - 15} y={y - 4} width="30" height="4" rx="2" fill={wall2} opacity="0.7" />
          {[-9, 0, 9].map((dx) => (
            <g key={dx}>
              <circle cx={x + dx} cy={y - 11} r="6" fill={roof} opacity="0.85" />
              <circle cx={x + dx - 2.4} cy={y - 13} r="3.2" fill={wall} opacity="0.5" />
            </g>
          ))}
        </g>
      );
  }
}

export function KnowledgeIsland({
  stats,
  documents = [],
  rotate = 0,
  className,
  compact = false,
}: {
  stats: IslandStats;
  /** 按解锁序号对应的真实文档（点地块时显示"这块地代表什么"） */
  documents?: IslandDoc[];
  /** 0..3 四个等距方向 */
  rotate?: number;
  className?: string;
  compact?: boolean;
}) {
  const island = useMemo(() => buildIsland(stats), [stats]);
  const [hover, setHover] = useState<string | null>(null);
  const [newFrom, setNewFrom] = useState<number | null>(null);
  const [picked, setPicked] = useState<{ gx: number; gz: number } | null>(null);
  const router = useRouter();
  const uid = useId().replace(/:/g, "");

  /** 进度格数（排除为了托住建筑而强制解锁的那几格，它们 order = -1） */
  const progress = useMemo(() => island.tiles.filter((t) => t.order >= 0).length, [island.tiles]);

  // 和上次看过的解锁数比较 → 找出这次新长出来的地块，放星火
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- localStorage 只有客户端可读，
       渲染期读会 hydration 不一致，只能在挂载后比较。 */
    const raw = localStorage.getItem(SEEN_KEY);
    const prev = raw === null ? null : Number(raw);
    if (prev !== null && Number.isFinite(prev) && progress > prev) setNewFrom(prev);
    else setNewFrom(null);
    /* eslint-enable react-hooks/set-state-in-effect */

    // 延迟落盘：让星火先播完，否则这次刷新就看不到"新"了
    const timer = window.setTimeout(() => localStorage.setItem(SEEN_KEY, String(progress)), 2600);
    return () => window.clearTimeout(timer);
  }, [progress]);

  /** 投影 + 包围盒（viewBox 用它，保证不裁切、不带黑边）；转视角时全部自动重算 */
  const geom = useMemo(() => {
    const items = [...island.tiles].sort((a, b) => {
      const [ax, az] = rotateCoords(a.gx, a.gz, rotate);
      const [bx, bz] = rotateCoords(b.gx, b.gz, rotate);
      return ax + az - (bx + bz) || az - bz || ax - bx;
    });
    const pts = items.map((t) => {
      const [rx, rz] = rotateCoords(t.gx, t.gz, rotate);
      return { t, ...project(rx, rz) };
    });
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y - p.t.h);
    const minX = Math.min(...xs) - TILE_W;
    const maxX = Math.max(...xs) + TILE_W;
    const minY = Math.min(...ys) - 60;
    const maxY = Math.max(...ys) + TILE_H + 14;
    return { pts, minX, minY, width: maxX - minX, height: maxY - minY, maxY };
  }, [island.tiles, rotate]);

  const { minX, minY, width, height, pts } = geom;

  const buildingPos = useMemo(
    () =>
      island.buildings.map((b) => {
        const [rx, rz] = rotateCoords(b.gx, b.gz, rotate);
        const p = project(rx, rz);
        return {
          b,
          left: ((p.x - minX) / width) * 100,
          top: ((p.y - (b.id === "lighthouse" ? 46 : b.id === "library" ? 36 : 30) - minY) / height) * 100,
        };
      }),
    [island.buildings, rotate, minX, minY, width, height],
  );

  const pickedText = useCallback(
    (order: number): { title: string; sub: string } => {
      if (order < 0) return { title: "建筑地基", sub: "这一格是为了托住建筑" };
      const d = documents[order];
      if (d) return { title: d.title, sub: `来自「${d.kb}」` };
      if (order < documents.length + 6) return { title: "一次对话 / 片段积累", sub: "还没有对应的文档" };
      return { title: "尚未对应具体内容", sub: "上传更多文档，这块地就会有归属" };
    },
    [documents],
  );

  const pickedPt = picked ? pts.find((p) => p.t.gx === picked.gx && p.t.gz === picked.gz) : null;

  return (
    <div className={cn("relative w-full", className)}>
      <svg
        viewBox={`${minX} ${minY} ${width} ${height}`}
        width="100%"
        style={{ aspectRatio: `${width} / ${height}`, display: "block" }}
        role="img"
        aria-label={`知行岛：已解锁 ${progress} / ${island.total} 格，${island.stage}${
          newFrom !== null ? `，新长出 ${progress - newFrom} 格` : ""
        }`}
      >
        <defs>
          <radialGradient id={`sea-${uid}`} cx="50%" cy="52%" r="58%">
            <stop offset="0%" stopColor="color-mix(in srgb, var(--theme-primary) 16%, transparent)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        <ellipse
          cx={minX + width / 2}
          cy={minY + height * 0.62}
          rx={width * 0.62}
          ry={height * 0.46}
          fill={`url(#sea-${uid})`}
        />

        {pts.map(({ t, x, y }) => {
          const isNew = newFrom !== null && t.order >= newFrom;
          const oi = isNew && newFrom !== null ? Math.min(12, t.order - newFrom) : 0;
          return (
            <g
              key={`${t.gx}-${t.gz}`}
              className={cn(isNew && "island-tile-new", !compact && "cursor-pointer")}
              style={isNew ? ({ "--oi": oi } as CSSProperties) : undefined}
              onClick={compact ? undefined : () => setPicked({ gx: t.gx, gz: t.gz })}
            >
              <Tile t={t} x={x} y={y} />
              {t.deco > 0 && !compact ? <Deco t={t} x={x} y={y} /> : null}
              {/* 星火：四向溅开的小点，确定性角度（不用随机） */}
              {isNew
                ? [0, 1, 2, 3, 4].map((k) => {
                  const a = (k / 5) * Math.PI * 2 + (t.order % 7) * 0.4;
                  return (
                    <circle
                      key={k}
                      className="island-spark"
                      cx={x}
                      cy={y - t.h - TILE_H / 2}
                      r={1.5}
                      fill="var(--theme-primary)"
                      style={
                        {
                          "--sx": `${Math.cos(a) * 15}px`,
                          "--sy": `${Math.sin(a) * 15 - 8}px`,
                          "--oi": oi,
                        } as CSSProperties
                      }
                    />
                  );
                })
                : null}
            </g>
          );
        })}

        {pts.map(({ t, x, y }) => {
          const b = island.buildings.find((v) => v.gx === t.gx && v.gz === t.gz);
          if (!b) return null;
          return (
            <g key={`b-${b.id}`} opacity={b.unlocked ? 1 : 0.28}>
              <Building kind={b.id} x={x} y={y - t.h + TILE_H / 2} />
            </g>
          );
        })}
      </svg>

      {buildingPos.map(({ b, left, top }) => (
        <button
          key={b.id}
          type="button"
          className={cn(
            "absolute -translate-x-1/2 -translate-y-1/2 rounded-full border backdrop-blur-sm transition",
            b.unlocked
              ? "border-primary/45 bg-primary/15 hover:scale-125 hover:bg-primary/35"
              : "border-border2/60 bg-black/25",
            compact ? "h-3.5 w-3.5" : "h-5 w-5",
          )}
          style={{ left: `${left}%`, top: `${top}%` }}
          aria-label={`${b.name}：${b.unlocked ? b.stat : "未解锁，" + b.need}`}
          onMouseEnter={() => setHover(b.id)}
          onMouseLeave={() => setHover(null)}
          onFocus={() => setHover(b.id)}
          onBlur={() => setHover(null)}
          onClick={() => b.unlocked && router.push(b.href)}
        >
          <span className="sr-only">{b.name}</span>
          {hover === b.id ? (
            <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-52 -translate-x-1/2 rounded-lg border border-border bg-surface2 p-2.5 text-left shadow-xl">
              <span className="block text-[12.5px] font-semibold text-fg">{b.name}</span>
              <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-fg">
                {b.unlocked ? b.role : `未解锁 · ${b.need}`}
              </span>
              <span className="mt-1 block text-[11px] text-primary">{b.unlocked ? b.stat : "继续积累就会解锁"}</span>
            </span>
          ) : null}
        </button>
      ))}

      {!compact
        ? buildingPos
            .filter(({ b }) => b.unlocked)
            .map(({ b, left, top }) => (
              <span
                key={`l-${b.id}`}
                className="num pointer-events-none absolute -translate-x-1/2 text-[10.5px] font-semibold text-fg"
                style={{ left: `${left}%`, top: `calc(${top}% + 16px)` }}
              >
                {b.name}
              </span>
            ))
        : null}

      {/* 点地块的说明卡 */}
      {picked && pickedPt && !compact ? (
        <div
          className="island-tip"
          style={{
            left: `${Math.min(78, Math.max(2, ((pickedPt.x - minX) / width) * 100))}%`,
            top: `${Math.min(88, (((pickedPt.y - pickedPt.t.h - minY) / height) * 100) + 4)}%`,
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 text-[12.5px] font-semibold text-fg">
              {pickedText(pickedPt.t.order).title}
            </p>
            <button
              type="button"
              className="shrink-0 text-[11px] text-muted-fg hover:text-fg"
              onClick={() => setPicked(null)}
              aria-label="关闭"
            >
              ✕
            </button>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-fg">
            {pickedText(pickedPt.t.order).sub}
          </p>
          <p className="num mt-1.5 text-[10.5px] text-primary">
            第 {pickedPt.t.order + 1} 块 · 海拔 {pickedPt.t.h}
          </p>
        </div>
      ) : null}
    </div>
  );
}
