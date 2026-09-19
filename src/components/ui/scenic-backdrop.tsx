import { cn } from "./cn";
import { SCENIC_SCENES, scenicDefaultLayer } from "@/config/scenic";

/**
 * 场景背板（§2「场景/摄影作为内容」）
 *
 * 整页固定的一层场景，衬在全部内容之后、不随滚动移动，靠 `.scenic-veil` 暗过渡
 * 把图溶进页面。三个场景各一份内联 SVG，按 <html data-scene> 只显示当前那份。
 *
 * 为什么是内联 SVG：skill 的 L7 沉淀 —— 热链第三方 CDN 图片会被 Chromium 的 ORB
 * 静默拦截，首屏变灰白占位。内联 SVG 零外链、零 CORS、离线可用。
 * 想换真照片：把这一层替换成 <img> 或背景图即可，veil 与其它 CSS 完全不用动。
 *
 * 所有随机形状都用固定 seed 的确定性伪随机 —— **不能**用 Math.random()，
 * 否则服务端与客户端渲染结果不一致，会触发 hydration 报错。
 */

type SceneKey = "rain" | "snow" | "cloud";

// 场景清单/默认背景都来自 src/config/scenic.ts，这里不再本地重复声明

function rnd(seed: number, i: number): number {
  const n = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

/** 一条锯齿山脊轮廓，自动封底到画布底部 */
function ridge(seed: number, baseY: number, amp: number, steps = 26): string {
  const pts = [`M0 ${baseY}`];
  for (let i = 1; i <= steps; i++) {
    const x = Math.round((1920 / steps) * i);
    const y = Math.round(baseY - amp * rnd(seed, i));
    pts.push(`L${x} ${y}`);
  }
  return `${pts.join(" ")} L1920 1120 L0 1120 Z`;
}

/** 悬浮尘埃/雨丝 */
function dust(seed: number, count: number, color: string) {
  return Array.from({ length: count }, (_, i) => {
    const x = Math.round(rnd(seed + 100, i * 3) * 1920);
    const y = Math.round(280 + rnd(seed + 200, i * 3 + 1) * 760);
    const r = (0.8 + rnd(seed + 300, i * 3 + 2) * 1.7).toFixed(1);
    const o = (0.08 + rnd(seed + 400, i * 3) * 0.16).toFixed(2);
    return <circle key={`d${i}`} cx={x} cy={y} r={r} fill={color} opacity={o} />;
  });
}

/** 热气球（cloud 场景母题，位置取自 skill §2 的模板） */
function balloons() {
  const items = [
    { x: 280, y: 370, rx: 42, ry: 54, body: "#7d5bd6", accent: "#b39bf0" },
    { x: 560, y: 300, rx: 34, ry: 44, body: "#4f7fd0", accent: "#8fb4f0" },
    { x: 1280, y: 260, rx: 56, ry: 72, body: "#f0c05a", accent: "#ffe39b" },
    { x: 960, y: 430, rx: 38, ry: 48, body: "#5fae76", accent: "#a3d9b3" },
    { x: 1580, y: 400, rx: 44, ry: 56, body: "#d96a5a", accent: "#f0a294" },
  ];
  return items.map((b, i) => (
    <g key={`b${i}`} opacity={0.92}>
      <ellipse cx={b.x} cy={b.y} rx={b.rx} ry={b.ry} fill={b.body} />
      <ellipse cx={b.x - b.rx * 0.3} cy={b.y - b.ry * 0.32} rx={b.rx * 0.42} ry={b.ry * 0.44} fill={b.accent} opacity={0.75} />
      <line x1={b.x - b.rx * 0.5} y1={b.y + b.ry * 0.85} x2={b.x - 5} y2={b.y + b.ry + 16} stroke="#2a2628" strokeWidth="1.5" />
      <line x1={b.x + b.rx * 0.5} y1={b.y + b.ry * 0.85} x2={b.x + 5} y2={b.y + b.ry + 16} stroke="#2a2628" strokeWidth="1.5" />
      <rect x={b.x - 8} y={b.y + b.ry + 16} width="16" height="11" rx="2" fill="#3c373a" />
    </g>
  ));
}

/** 针叶林剪影（snow / rain 母题） */
function pines(seed: number, count: number, baseY: number, color: string, height: number) {
  return Array.from({ length: count }, (_, i) => {
    const x = Math.round(120 + rnd(seed + 500, i) * 1680);
    const h = Math.round(height * (0.7 + rnd(seed + 600, i) * 0.6));
    const w = Math.round(h * 0.36);
    const y = baseY - Math.round(rnd(seed + 700, i) * 30);
    return (
      <path
        key={`p${i}`}
        d={`M${x} ${y - h} L${x + w} ${y} L${x - w} ${y} Z`}
        fill={color}
        opacity={0.9}
      />
    );
  });
}

function Scene({ scene }: { scene: SceneKey }) {
  const skyId = `sky-${scene}`;
  const glowId = `glow-${scene}`;

  const sky: Record<SceneKey, { stops: string[]; glow: { cx: number; cy: number; r: number; c: string; o: number } }> = {
    rain: {
      stops: ["#08130e", "#0b1e15", "#0f3a28", "#226a3b"],
      glow: { cx: 1180, cy: 230, r: 560, c: "#9fe87f", o: 0.22 },
    },
    snow: {
      stops: ["#09131e", "#0e1d2d", "#203a58", "#4a6a93"],
      glow: { cx: 900, cy: 200, r: 600, c: "#cfe6ff", o: 0.24 },
    },
    cloud: {
      stops: ["#1e2a3d", "#3d3d5c", "#c47a4a", "#efb069", "#f6d47e"],
      glow: { cx: 740, cy: 640, r: 460, c: "#ffd98a", o: 0.34 },
    },
  };

  const ridges: Record<SceneKey, { seed: number; baseY: number; amp: number; fill: string }[]> = {
    rain: [
      { seed: 3, baseY: 640, amp: 150, fill: "#0e2a1e" },
      { seed: 7, baseY: 800, amp: 120, fill: "#081b13" },
      { seed: 11, baseY: 940, amp: 100, fill: "#040e09" },
    ],
    snow: [
      { seed: 5, baseY: 620, amp: 175, fill: "#142232" },
      { seed: 9, baseY: 790, amp: 130, fill: "#0d1823" },
      { seed: 13, baseY: 940, amp: 110, fill: "#060b11" },
    ],
    cloud: [
      { seed: 4, baseY: 660, amp: 185, fill: "#4d4a5e" },
      { seed: 8, baseY: 820, amp: 150, fill: "#3c373a" },
      { seed: 12, baseY: 960, amp: 120, fill: "#2a2628" },
    ],
  };

  const s = sky[scene];

  return (
    <svg
      data-for={scene}
      className="scenic-backdrop"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
          {s.stops.map((c, i) => (
            <stop key={c} offset={`${(i / (s.stops.length - 1)) * 100}%`} stopColor={c} />
          ))}
        </linearGradient>
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={s.glow.c} stopOpacity={s.glow.o} />
          <stop offset="55%" stopColor={s.glow.c} stopOpacity={s.glow.o * 0.35} />
          <stop offset="100%" stopColor={s.glow.c} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 天空 */}
      <rect width="1920" height="1080" fill={`url(#${skyId})`} />
      {/* 主光源 */}
      <circle cx={s.glow.cx} cy={s.glow.cy} r={s.glow.r} fill={`url(#${glowId})`} />

      {/* 场景母题：光源之后、山脊之前 */}
      {scene === "snow" && (
        <>
          <ellipse cx="700" cy="240" rx="620" ry="120" fill="#6fe3c0" opacity="0.14" transform="rotate(-12 700 240)" />
          <ellipse cx="1180" cy="180" rx="520" ry="90" fill="#8fb4f0" opacity="0.13" transform="rotate(-8 1180 180)" />
        </>
      )}
      {scene === "cloud" && balloons()}

      {/* 山脊：远 → 近 */}
      {ridges[scene].map((r) => (
        <path key={r.seed} d={ridge(r.seed, r.baseY, r.amp)} fill={r.fill} />
      ))}

      {/* 近景针叶林 */}
      {scene === "rain" && pines(21, 16, 960, "#030b07", 150)}
      {scene === "snow" && pines(23, 12, 955, "#05090e", 120)}

      {/* 雨林顶棚：从上方压住画面边缘，制造"身处林中"的框感 */}
      {scene === "rain" && (
        <>
          <path d="M0 0 L640 0 C560 120 420 210 250 268 C150 302 60 340 0 372 Z" fill="#030f0a" opacity="0.95" />
          <path d="M1920 0 L1260 0 C1330 130 1470 220 1650 286 C1750 322 1850 360 1920 396 Z" fill="#030f0a" opacity="0.9" />
          <path d="M300 0 L520 0 C500 92 430 176 330 240 C300 258 268 272 240 282 Z" fill="#06180f" opacity="0.7" />
        </>
      )}

      {/* 光柱（rain）：从右上方斜切下来 */}
      {scene === "rain" && (
        <g opacity="0.1">
          <path d="M1160 0 L1310 0 L980 1080 L840 1080 Z" fill="#d7ef83" />
          <path d="M1400 0 L1470 0 L1180 1080 L1108 1080 Z" fill="#d7ef83" />
          <path d="M980 0 L1040 0 L760 1080 L700 1080 Z" fill="#d7ef83" />
        </g>
      )}

      {/* 尘埃 / 雨丝 / 雪粒 */}
      {dust(scene === "rain" ? 31 : scene === "snow" ? 37 : 41, scene === "snow" ? 46 : 30,
        scene === "rain" ? "#d7ef83" : scene === "snow" ? "#ffffff" : "#ffe6b8")}
    </svg>
  );
}

export function ScenicBackdrop({
  scenes = SCENIC_SCENES,
  veil = true,
  grain = true,
  className,
}: {
  /** 渲染哪几个场景的背板（按 data-scene 自动只显示一个） */
  scenes?: SceneKey[];
  /**
   * 暗过渡 veil。只有真背板才要，纯材质页不要加。
   * "strong" 是给**应用内页**用的淡版：遮罩更厚，场景只剩隐约的氛围，
   * 玻璃面板终于有东西可以 backdrop-blur —— 这就是「有光影层次」的来源。
   */
  veil?: boolean | "strong";
  /** 胶片噪点（≤3%，质感而不是脏点） */
  grain?: boolean;
  className?: string;
}) {
  return (
    <>
      {/* 内置矢量场景：只有用户把该场景的背景显式设成 none 时才看得到 */}
      {scenes.map((s) => (
        <Scene key={s} scene={s} />
      ))}

      {/* 实景照片层。优先读 CSS 变量（用户在 /settings → 场景背景 里选的），
          没设时落到 src/config/scenic.ts 里该场景的默认预设。
          必须排在 SVG 之后 —— 同层靠 DOM 顺序决定谁在上面，
          所以配了图的场景自动盖住内置矢量场景；变量为 none 时整层透明，矢量场景照旧显示。 */}
      {scenes.map((s) => (
        <div
          key={`custom-${s}`}
          data-for={s}
          className={cn("scenic-custom", className)}
          style={scenicDefaultLayer(s)}
          aria-hidden="true"
        />
      ))}

      {veil ? (
        <div
          className={cn("scenic-veil", veil === "strong" && "scenic-veil-strong", className)}
          aria-hidden="true"
        />
      ) : null}
      {grain ? <div className="ui-grain" aria-hidden="true" /> : null}
    </>
  );
}

export type { SceneKey };
