/**
 * 知行岛分享卡片 · 几何与绘制（纯函数，不碰 DOM）。
 *
 * 为什么用 Canvas 手绘，而不是截 3D 画布的图：
 *  1) WebGL 画布要 `preserveDrawingBuffer: true` 才能读像素，否则 `toDataURL` 拿到的是**黑图**；
 *  2) 3D 视图要等 600KB 的 three 加载完才存在，而 2D 视图是 SVG —— 两者都不适合直接截；
 *  3) 卡片的排版本来就该是"设计过的卡片"，而不是页面截图。
 *
 * 几何复用 `island-model`：`buildIsland()` 给瓦片海拔/装饰/建筑等级，`project()` 给等距投影，
 * 所以卡片上那座岛的**形状和页面上的岛完全一致**（同一份确定性模型），只有画法（配色/简化细节）
 * 是卡片自己的。若哪天页面的岛换了画风，卡片不会跟着变 —— 这是刻意的取舍。
 *
 * 颜色：`ctx.fillStyle` **不认识** `color-mix()` 和 `var()`，传进去会被静默忽略（保持上一个颜色，
 * 于是整块画成同色，还不报错）。所以这里把 CSS 变量解析成具体色值，再自己按比例混合。
 */

import {
  project,
  TILE_W,
  TILE_H,
  type Island,
  type IslandBuilding,
  type IslandStats,
  type IslandTile,
} from "@/components/island/island-model";

/** 卡片尺寸（16:9，和常见分享图一致） */
export const CARD_W = 1200;
export const CARD_H = 675;
/** 导出倍率：2 倍更清晰，文字不糊 */
export const PIXEL_RATIO = 2;

export type SceneKey2 = "rain" | "snow" | "cloud";

export type CardPalette = {
  /** 主色（已解析成具体色值） */
  primary: string;
  background: string;
  foreground: string;
  scene: SceneKey2;
};

/** 读不到 CSS 变量时的兜底（同时也让卡片在没有主题的页面里可用） */
export const SCENE_FALLBACK: Record<SceneKey2, CardPalette> = {
  rain: { primary: "#2f7d5a", background: "#0d1512", foreground: "#e6efe9", scene: "rain" },
  snow: { primary: "#4a6fa5", background: "#eef2f7", foreground: "#1a2230", scene: "snow" },
  cloud: { primary: "#d97706", background: "#1a1410", foreground: "#f6ece1", scene: "cloud" },
};

type RGB = { r: number; g: number; b: number };

/**
 * 解析 `#rgb` / `#rrggbb` / `rgb(r,g,b)`。解析不了返回 null ——
 * 绝不把原样字符串塞进 fillStyle（那正是会被静默忽略的坑）。
 */
export function parseColor(input: string): RGB | null {
  const s = input.trim();
  const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1];
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
    };
  }
  const rgb = s.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i);
  if (rgb) {
    return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
  }
  return null;
}

const clamp255 = (n: number) => Math.max(0, Math.min(255, Math.round(n)));

export function toHex(c: RGB): string {
  return "#" + [c.r, c.g, c.b].map((n) => clamp255(n).toString(16).padStart(2, "0")).join("");
}

/**
 * 按比例混合两个颜色：`mix(a, b, w)` = a 占 (1-w)、b 占 w。
 * 语义对齐 CSS 的 `color-mix(in srgb, a (1-w)*100%, b w*100%)`。
 * 任一色解析不出来就退回另一个（宁可少一层层次，也不要画出错误的颜色）。
 */
export function mix(a: string, b: string, w: number): string {
  const ca = parseColor(a);
  const cb = parseColor(b);
  if (!ca && !cb) return "#000000";
  if (!ca) return toHex(cb as RGB);
  if (!cb) return toHex(ca);
  const t = Math.max(0, Math.min(1, w));
  return toHex({
    r: ca.r * (1 - t) + cb.r * t,
    g: ca.g * (1 - t) + cb.g * t,
    b: ca.b * (1 - t) + cb.b * t,
  });
}

/** 供测试与断言：这个字符串是不是 canvas 能接受的实色 */
export function isConcreteColor(v: unknown): boolean {
  return typeof v === "string" && parseColor(v) !== null;
}

/**
 * 兜底：解析不了就用给定色。
 * 调色板在入口处统一过一遍，保证**任何**路径都不会把 `var()` / `color-mix()` 塞进 fillStyle
 * （那会被 canvas 静默忽略、保持上一个颜色，整块画成同色还不报错）。
 */
function solid(color: string, fallback: string): string {
  return isConcreteColor(color) ? color : fallback;
}

// ── 投影与包围盒 ─────────────────────────────────────────────

export type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

/** 建筑往上长，包围盒要留出屋顶高度，否则顶部会被裁掉 */
const BUILDING_HEADROOM = 52;
/** 树最高约 22 × 最大变体 1.17 ≈ 26，再留一点余量；不算进来树尖会被裁掉 */
const DECO_HEADROOM = 30;

/** 投影后（含高度与屋顶）的包围盒。确定性，便于断言卡片不会裁掉岛。 */
export function islandBounds(island: Island): Bounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const hw = TILE_W / 2;
  const hh = TILE_H / 2;
  for (const t of island.tiles) {
    const p = project(t.gx, t.gz);
    const top = p.y - t.h;
    minX = Math.min(minX, p.x - hw);
    maxX = Math.max(maxX, p.x + hw);
    minY = Math.min(minY, top - hh - (t.deco !== 0 ? DECO_HEADROOM : 0));
    maxY = Math.max(maxY, p.y + hh);
  }
  for (const b of island.buildings) {
    if (!b.unlocked) continue;
    const p = project(b.gx, b.gz);
    minY = Math.min(minY, p.y - BUILDING_HEADROOM);
    minX = Math.min(minX, p.x - hw);
    maxX = Math.max(maxX, p.x + hw);
  }
  if (!Number.isFinite(minX)) return { minX: 0, minY: 0, maxX: 1, maxY: 1 };
  return { minX, minY, maxX, maxY };
}

export type CardLayout = {
  scale: number;
  offsetX: number;
  offsetY: number;
  /** 缩放后岛在卡片上的实际占位（用于断言没越界） */
  box: { left: number; top: number; width: number; height: number };
};

/** 把整座岛等比缩放进指定区域并居中 */
export function cardLayout(
  island: Island,
  area: { x: number; y: number; w: number; h: number },
): CardLayout {
  const b = islandBounds(island);
  const w = Math.max(1, b.maxX - b.minX);
  const h = Math.max(1, b.maxY - b.minY);
  const scale = Math.min(area.w / w, area.h / h);
  const width = w * scale;
  const height = h * scale;
  const left = area.x + (area.w - width) / 2;
  const top = area.y + (area.h - height) / 2;
  return {
    scale,
    // 网格坐标原点映射到卡片上的位置
    offsetX: left - b.minX * scale,
    offsetY: top - b.minY * scale,
    box: { left, top, width, height },
  };
}

// ── 文案 ────────────────────────────────────────────────────

export type CardStat = { label: string; value: string };

/** 卡片底部那排数字。单独抽出来是为了能断言"该显示的都在" */
export function cardStats(stats: IslandStats, island: Island): CardStat[] {
  return [
    { label: "成长分", value: String(island.score) },
    { label: "地块", value: `${island.unlocked} / ${island.total}` },
    { label: "知识库", value: String(stats.kb) },
    { label: "文档", value: String(stats.doc) },
    { label: "知识片段", value: String(stats.chunk) },
    { label: "对话", value: String(stats.conv) },
    { label: "简历", value: String(stats.resume) },
  ];
}

export function cardFileName(score: number, date: Date): string {
  const d = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
    date.getDate(),
  ).padStart(2, "0")}`;
  return `知行岛-${score}分-${d}.png`;
}

// ── 绘制 ────────────────────────────────────────────────────

/**
 * 只声明用得到的方法：这样 node 里可以塞一个"记录调用"的假 ctx 来验证绘制逻辑
 * （真实 CanvasRenderingContext2D 结构上满足这个类型）。
 */
export type Ctx2D = {
  fillStyle: string | CanvasGradient | CanvasPattern;
  font: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
  globalAlpha: number;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  closePath(): void;
  fill(): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  fillText(text: string, x: number, y: number): void;
  save(): void;
  restore(): void;
  createLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradient;
};

const FONT_STACK = `system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif`;

export type DrawCardOptions = {
  island: Island;
  stats: IslandStats;
  palette: CardPalette;
  /** 左上角标题（一般是用户名） */
  title: string;
  score: number;
  date: Date;
};

/** 画一块瓦片：左立面 / 右立面 / 顶面 */
function drawTile(ctx: Ctx2D, t: IslandTile, x: number, y: number, p: CardPalette) {
  const hw = TILE_W / 2;
  const hh = TILE_H / 2;
  const top = y - t.h;
  const base =
    t.kind === "rock" ? p.foreground : p.primary;
  const strength = t.kind === "sand" ? 0.46 : t.kind === "rock" ? 0.24 : 0.26;
  const topFill = mix(base, p.background, 1 - strength);
  const leftFill = mix(base, p.background, 1 - strength * 0.5);
  const rightFill = mix(base, p.background, 1 - strength * 0.24);

  ctx.fillStyle = leftFill;
  ctx.beginPath();
  ctx.moveTo(x - hw, top);
  ctx.lineTo(x, top + hh);
  ctx.lineTo(x, y + hh);
  ctx.lineTo(x - hw, y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = rightFill;
  ctx.beginPath();
  ctx.moveTo(x + hw, top);
  ctx.lineTo(x, top + hh);
  ctx.lineTo(x, y + hh);
  ctx.lineTo(x + hw, y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = topFill;
  ctx.beginPath();
  ctx.moveTo(x, top - hh);
  ctx.lineTo(x + hw, top);
  ctx.lineTo(x, top + hh);
  ctx.lineTo(x - hw, top);
  ctx.closePath();
  ctx.fill();
}

/** 装饰物：树 / 石 / 蕨。相比页面上的 SVG 做了简化（卡片不需要那么细） */
function drawDeco(ctx: Ctx2D, t: IslandTile, x: number, y: number, p: CardPalette) {
  if (t.deco === 0) return;
  const top = y - t.h - TILE_H / 2;
  if (t.deco === 1) {
    const s = 0.85 + t.decoV * 0.16;
    ctx.fillStyle = mix(p.background, "#000000", 0.3);
    ctx.fillRect(x - 1.1, top - 8 * s, 2.2, 9 * s);
    ctx.fillStyle = mix(p.primary, p.background, 1 - 0.62);
    ctx.beginPath();
    ctx.moveTo(x, top - 22 * s);
    ctx.lineTo(x + 6.4 * s, top - 7 * s);
    ctx.lineTo(x - 6.4 * s, top - 7 * s);
    ctx.closePath();
    ctx.fill();
    return;
  }
  if (t.deco === 2) {
    ctx.fillStyle = mix(p.foreground, p.background, 1 - 0.34);
    ctx.beginPath();
    ctx.moveTo(x - 4, top);
    ctx.lineTo(x + 3.4, top - 2);
    ctx.lineTo(x + 4.4, top - 6);
    ctx.lineTo(x, top - 8);
    ctx.lineTo(x - 4.6, top - 5);
    ctx.closePath();
    ctx.fill();
    return;
  }
  ctx.fillStyle = mix(p.primary, p.background, 1 - 0.55);
  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.lineTo(x - 5, top - 8);
  ctx.lineTo(x - 1.4, top - 7.4);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.lineTo(x, top - 10);
  ctx.lineTo(x + 1.5, top - 7.4);
  ctx.closePath();
  ctx.fill();
}

/** 建筑：简化成"墙 + 屋顶"，尺寸按等级放大。形状与页面上一致（都来自同一份模型坐标） */
function drawBuilding(ctx: Ctx2D, b: IslandBuilding, x: number, y: number, p: CardPalette) {
  const s = 0.85 + (b.level - 1) * 0.22;
  const wall = mix(p.foreground, p.background, 1 - 0.86);
  const wallDark = mix(p.foreground, p.background, 1 - 0.5);
  const roof = p.primary;

  if (b.id === "lighthouse") {
    ctx.fillStyle = wall;
    ctx.beginPath();
    ctx.moveTo(x - 6 * s, y);
    ctx.lineTo(x + 6 * s, y);
    ctx.lineTo(x + 3.4 * s, y - 30 * s);
    ctx.lineTo(x - 3.4 * s, y - 30 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = roof;
    ctx.beginPath();
    ctx.moveTo(x, y - 38 * s);
    ctx.lineTo(x + 5 * s, y - 34 * s);
    ctx.lineTo(x, y - 30 * s);
    ctx.lineTo(x - 5 * s, y - 34 * s);
    ctx.closePath();
    ctx.fill();
    return;
  }

  ctx.fillStyle = wall;
  ctx.fillRect(x - 12 * s, y - 18 * s, 24 * s, 18 * s);
  ctx.fillStyle = wallDark;
  ctx.fillRect(x - 4 * s, y - 12 * s, 8 * s, 12 * s);
  ctx.fillStyle = roof;
  ctx.beginPath();
  ctx.moveTo(x - 16 * s, y - 18 * s);
  ctx.lineTo(x, y - 32 * s);
  ctx.lineTo(x + 16 * s, y - 18 * s);
  ctx.closePath();
  ctx.fill();
}

/**
 * 把整张卡片画到 ctx 上（坐标以 CARD_W × CARD_H 为基准，调用方负责按倍率缩放）。
 */
export function drawIslandCard(ctx: Ctx2D, opts: DrawCardOptions): void {
  const { island, stats, title, score, date } = opts;

  // 入口处规范化调色板：读不到 CSS 变量就退回该场景的兜底色。
  // 这样下面所有直接赋值（fillStyle = p.primary 之类）都是安全的。
  const fb = SCENE_FALLBACK[opts.palette.scene] ?? SCENE_FALLBACK.cloud;
  const p: CardPalette = {
    primary: solid(opts.palette.primary, fb.primary),
    background: solid(opts.palette.background, fb.background),
    foreground: solid(opts.palette.foreground, fb.foreground),
    scene: opts.palette.scene,
  };

  // 1) 底色：自上而下由背景色渐变到更暗
  const bg = ctx.createLinearGradient(0, 0, 0, CARD_H);
  bg.addColorStop(0, mix(p.background, p.primary, 0.1));
  bg.addColorStop(1, mix(p.background, "#000000", 0.35));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // 2) 岛的光晕
  ctx.save();
  ctx.globalAlpha = 0.16;
  const glow = ctx.createLinearGradient(0, CARD_H * 0.35, 0, CARD_H);
  glow.addColorStop(0, mix(p.primary, p.background, 0.6));
  glow.addColorStop(1, mix(p.background, "#000000", 0.4));
  ctx.fillStyle = glow;
  ctx.fillRect(0, CARD_H * 0.35, CARD_W, CARD_H * 0.65);
  ctx.restore();

  // 3) 岛：按 (gx+gz) 排序 = 等距视角的"从远到近"，近处的瓦片覆盖远处的
  const layout = cardLayout(island, { x: 40, y: 150, w: CARD_W - 80, h: CARD_H - 300 });
  const placed = island.tiles
    .map((t) => ({ t, ...project(t.gx, t.gz) }))
    .sort((a, b) => a.t.gx + a.t.gz - (b.t.gx + b.t.gz) || a.t.gx - b.t.gx);
  const at = (x: number, y: number) => ({
    x: x * layout.scale + layout.offsetX,
    y: y * layout.scale + layout.offsetY,
  });

  for (const item of placed) {
    const q = at(item.x, item.y);
    drawTile(ctx, item.t, q.x, q.y, p);
  }
  for (const item of placed) {
    if (item.t.deco === 0) continue;
    const q = at(item.x, item.y);
    drawDeco(ctx, item.t, q.x, q.y, p);
  }
  for (const b of island.buildings) {
    if (!b.unlocked) continue;
    const pr = project(b.gx, b.gz);
    const q = at(pr.x, pr.y);
    drawBuilding(ctx, b, q.x, q.y, p);
  }

  // 4) 左上：标题 + 阶段
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = p.foreground;
  ctx.font = `700 46px ${FONT_STACK}`;
  ctx.fillText(title, 56, 92);
  ctx.fillStyle = mix(p.foreground, p.background, 0.4);
  ctx.font = `400 22px ${FONT_STACK}`;
  ctx.fillText(island.stage, 58, 128);

  // 5) 右上：成长分
  ctx.textAlign = "right";
  ctx.fillStyle = mix(p.foreground, p.background, 0.45);
  ctx.font = `500 20px ${FONT_STACK}`;
  ctx.fillText("成长分", CARD_W - 56, 68);
  ctx.fillStyle = p.primary;
  ctx.font = `700 54px ${FONT_STACK}`;
  ctx.fillText(String(score), CARD_W - 56, 118);

  // 6) 底部：一排数字
  const stats_ = cardStats(stats, island);
  const colW = (CARD_W - 96) / stats_.length;
  stats_.forEach((s, i) => {
    const x = 56 + colW * i + colW / 2;
    ctx.textAlign = "center";
    ctx.fillStyle = mix(p.foreground, p.background, 0.45);
    ctx.font = `400 17px ${FONT_STACK}`;
    ctx.fillText(s.label, x, CARD_H - 74);
    ctx.fillStyle = p.foreground;
    ctx.font = `700 28px ${FONT_STACK}`;
    ctx.fillText(s.value, x, CARD_H - 38);
  });

  // 7) 页脚：品牌 + 日期
  ctx.textAlign = "left";
  ctx.fillStyle = mix(p.foreground, p.background, 0.55);
  ctx.font = `500 17px ${FONT_STACK}`;
  ctx.fillText("知行 · 我的知识岛", 56, CARD_H - 12);
  ctx.textAlign = "right";
  ctx.fillText(
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate(),
    ).padStart(2, "0")}`,
    CARD_W - 56,
    CARD_H - 12,
  );
  ctx.textAlign = "left";
}
