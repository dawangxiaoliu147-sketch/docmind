"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Canvas, invalidate, useFrame, useThree } from "@react-three/fiber";
import { Color, Object3D, type Group, type InstancedMesh } from "three";
import { OrbitControls } from "@react-three/drei";
import {
  buildIsland,
  TILE_H,
  GRID_X,
  GRID_Z,
  type IslandBuilding,
  type IslandStats,
  type TileKind,
} from "./island-model";
import { cn } from "@/components/ui";

/**
 * 知行岛 · 3D 渲染层（等距体素）。地形 / 海拔 / 建筑位置全部来自 island-model，与 2D 版同源。
 * 不 import three：three 无类型声明（TS7016），R3F 的 JSX 类型在 skipLibCheck 下也被放宽，
 * 于是颜色用十六进制数值、几何体用 R3F 的声明式组件。
 * 换肤：CSS 自定义属性对 WebGL 不可见，颜色只能客户端 getComputedStyle 读出来手工做 color-mix。
 * 顶层 import 安全（ESM 求值不碰 window）；真正不能上服务端的只是创建 WebGL 上下文。
 */

/**
 * 海拔换算：2D 的 h 单位是像素，而一格竖直跨度正好 TILE_H 像素，所以 h / HEIGHT_UNIT 才是格数。
 * TILE_W / TILE_H 只用在这里，不参与 XZ 尺寸（一格 = 1 个世界单位）。
 */
const HEIGHT_UNIT = TILE_H;

/** 岛在 XZ 平面上的中心（以格为单位）。旋转必须绕它，否则岛会绕世界原点公转 */
const CENTER_GX = (GRID_X - 1) / 2;
const CENTER_GZ = (GRID_Z - 1) / 2;

/** 相机沿等距方向（+x / +z 象限，yaw 45°）。zoom 对透视相机无效，正交取景由 <FitCamera> 反解 */
const CAMERA_POSITION: [number, number, number] = [14, 13, 14];
/** 正交的初始 zoom；真正生效的值由 <FitCamera> 按包围球反解 */
const CAMERA_ZOOM_INITIAL = 30;

/** 格间世界间距（> 1 才在方块之间留缝）；1.55 让每根柱子各自成形，而不是连成一片陆地 */
const CELL_SPREAD = 1.55;
/** 建筑的固定朝向：相机在 +x/+z 象限，面转到 45° 正好面向镜头，不会把尖角戳过来 */
const BUILDING_YAW = Math.PI / 4;

/* ------------------------------------------------------------------ *
 * 色彩：在 WebGL 里复刻 CSS color-mix(in srgb, A p%, B)
 * ------------------------------------------------------------------ */

type Rgb = { r: number; g: number; b: number };

/** 读 <html> 上的一个自定义属性并解析成 RGB；读不到或解析失败就退回默认值 */
function readToken(name: string, fallbackHex: string): Rgb {
  const fallback = parseColor(fallbackHex) ?? { r: 128, g: 128, b: 128 };
  if (typeof window === "undefined") return fallback;
  const raw = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return parseColor(raw) ?? fallback;
}

/**
 * 支持 #rgb / #rrggbb / rgb() / rgba()。getComputedStyle 返回的是计算值，浏览器已把
 * oklch() / hsl() / 命名色归一化成 rgb(a)，所以实际基本只走 rgb 分支。
 */
function parseColor(raw: string): Rgb | null {
  if (!raw) return null;
  const text = raw.trim().toLowerCase();

  const m = text.match(/^rgba?\(([^)]+)\)$/);
  if (m) {
    const nums = m[1]
      .split(/[\s,/]+/)
      .filter(Boolean)
      .map(Number);
    if (nums.length >= 3 && nums.slice(0, 3).every((n) => Number.isFinite(n))) {
      return { r: nums[0], g: nums[1], b: nums[2] };
    }
  }

  const hex = text.replace(/^#/, "");
  if (/^[0-9a-f]{3}$/.test(hex)) {
    return {
      r: parseInt(hex[0] + hex[0], 16),
      g: parseInt(hex[1] + hex[1], 16),
      b: parseInt(hex[2] + hex[2], 16),
    };
  }
  if (/^[0-9a-f]{6}$/.test(hex)) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }
  return null;
}

function clamp255(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function toHex({ r, g, b }: Rgb): number {
  return (clamp255(r) << 16) | (clamp255(g) << 8) | clamp255(b);
}

/** color-mix(in srgb, a pct%, b) 的等价实现：逐分量按权重线性插值 */
function mix(a: Rgb, pct: number, b: Rgb): number {
  const t = pct / 100;
  return toHex({
    r: a.r * t + b.r * (1 - t),
    g: a.g * t + b.g * (1 - t),
    b: a.b * t + b.b * (1 - t),
  });
}

/**
 * 按比例压暗（等价 color-mix(..., #000)）。用分量缩放而不是减常量：色相基本不变、只是变暗，
 * 门洞 / 栈桥立柱 / 阴面会跟着场景底色走，不会在任何场景下都糊成同一块死黑。
 */
function darken(rgb: Rgb, keepPct: number): number {
  const t = keepPct / 100;
  return toHex({ r: rgb.r * t, g: rgb.g * t, b: rgb.b * t });
}

/* ------------------------------------------------------------------ *
 * 调色板
 * ------------------------------------------------------------------ */

type Palette = {
  grass: number;
  rock: number;
  sand: number;
  wall: number;
  wall2: number;
  roof: number;
  dark: number;
  soft: number;
};

/** 令牌为空时（比如脱离 data-scene 单独渲染）的兜底，取雨林场景的量级 */
const FALLBACK = { background: "#081713", foreground: "#f2f8f4", primary: "#d7ef83" };

/** 令牌 → 材质色（十六进制数值）；百分比与 2D 版 FACE / Building 的 color-mix 一一对应 */
function readPalette(): Palette {
  const bg = readToken("--theme-background", FALLBACK.background);
  const fg = readToken("--theme-foreground", FALLBACK.foreground);
  const primary = readToken("--theme-primary", FALLBACK.primary);

  return {
    // 草地：主色 26% 压到背景上（对应 2D 的顶面那一档）；岩石：前景色 24%；沙：主色 46%
    grass: mix(primary, 26, bg),
    rock: mix(fg, 24, bg),
    sand: mix(primary, 46, bg),
    // 建筑：墙 = 前景色 88%，次墙 = 62%，屋顶 = 主色原色
    wall: mix(fg, 88, bg),
    wall2: mix(fg, 62, bg),
    roof: toHex(primary),
    dark: darken(bg, 40),
    soft: mix(primary, 62, bg),
  };
}

function samePalette(a: Palette, b: Palette): boolean {
  return (
    a.grass === b.grass &&
    a.rock === b.rock &&
    a.sand === b.sand &&
    a.wall === b.wall &&
    a.wall2 === b.wall2 &&
    a.roof === b.roof &&
    a.dark === b.dark &&
    a.soft === b.soft
  );
}

/**
 * 订阅 <html data-scene> 与 class 并返回当前调色板；首帧用 SSR 也能算出的默认值，挂载后才读真实令牌。
 * 用 MutationObserver 而不是把场景当 prop 传：换场景是低频事件，免得 WebGL 子树与上层 UI 状态绑死。
 */
function usePalette(): Palette {
  const [palette, setPalette] = useState<Palette>(() => readPalette());

  useEffect(() => {
    let raf1 = 0;
    let raf2 = 0;

    const sync = () => {
      // 双重 rAF：data-scene 刚被改写时样式表可能还没重算，下一帧读到的才是新值
      raf1 = window.requestAnimationFrame(() => {
        raf2 = window.requestAnimationFrame(() => {
          setPalette((prev) => {
            const next = readPalette();
            // 值没变就返回同一个对象，避免属性抖动触发无谓的重渲染
            return samePalette(prev, next) ? prev : next;
          });
        });
      });
    };

    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-scene", "class"],
    });
    sync();

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, []);

  return palette;
}

/* ------------------------------------------------------------------ *
 * 场景
 * ------------------------------------------------------------------ */

type TileGeom = {
  key: string;
  /** 世界坐标（已等距投影）；y 取半高，让方块底面正好落在 0 平面 */
  x: number;
  y: number;
  z: number;
  /** 方块高度（世界单位），挤出方向朝上 */
  h: number;
  kind: TileKind;
  /** 装饰物：0 无 / 1 针叶树 / 2 石 / 3 蕨（和 2D 模型的 deco 完全同源） */
  deco: number;
  /** 装饰物变体号，用来做高矮/角度的微差 */
  decoV: number;
};

type BuildingNode = {
  b: IslandBuilding;
  x: number;
  z: number;
  /** 该格的地表高度：房子必须站在地面上，不能按固定高度悬空或埋进去 */
  ground: number;
};

/**
 * 每种建筑「自身原点到自身底面」的距离（几何体以原点为中心，所以就是半个高度）；
 * 每个零件再单独加自己的相对位置，房子永远坐在它那块地的顶面上。
 */
const BUILDING_BASE: Record<IslandBuilding["id"], number> = {
  library: 0.75,
  lighthouse: 1.2,
  workshop: 0.75,
  harbor: 0.15,
  camp: 0.75,
  garden: 0.5,
};

/** 地块 kind → 调色板键 */
const KIND_COLOR: Record<TileKind, keyof Palette> = {
  grass: "grass",
  rock: "rock",
  sand: "sand",
};

function Scene({
  stats,
  rotate,
  palette,
  bob,
  weather,
  cap,
}: {
  stats: IslandStats;
  rotate: number;
  palette: Palette;
  /** 柱子是否自动上下悬浮 */
  bob: boolean;
  weather: IslandWeather;
  /** 柱顶是否加白雪盖 */
  cap: boolean;
}) {
  const island = useMemo(() => buildIsland(stats), [stats]);

  /**
   * 地块 → 世界坐标：一格 = 1 个世界单位、网格轴对齐，并减去岛心让整座岛居中。
   * 不能用 project() 的像素值（±345 级）：那会把格子摆到 46 单位宽，相机直接埋在岛内部。
   */
  const tiles = useMemo<TileGeom[]>(
    () =>
      island.tiles.map((t) => {
        // 1.45 拉大高差：参考效果里柱子的高矮差别很夸张，原比例太平了
        const h = Math.max(0.7, (t.h / HEIGHT_UNIT) * 1.45);
        return {
          key: `${t.gx},${t.gz}`,
          x: (t.gx - CENTER_GX) * CELL_SPREAD,
          y: h / 2,
          z: (t.gz - CENTER_GZ) * CELL_SPREAD,
          h,
          kind: t.kind,
          deco: t.deco,
          decoV: t.decoV,
        };
      }),
    [island.tiles],
  );

  /** 地表高度表，供建筑查自己脚下的高度 */
  const ground = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tiles) map.set(t.key, t.h);
    return map;
  }, [tiles]);

  const buildings = useMemo<BuildingNode[]>(
    () =>
      island.buildings.map((b) => ({
        b,
        x: (b.gx - CENTER_GX) * CELL_SPREAD,
        z: (b.gz - CENTER_GZ) * CELL_SPREAD,
        ground: ground.get(`${b.gx},${b.gz}`) ?? 0,
      })),
    [island.buildings, ground],
  );

  /**
   * 岛的 XZ 足迹（x 半宽 / z 半深）分轴取 —— 不能用 radius（那是 hypot(x,z) 的对角长度），
   * 否则 z 方向会多撒出 70%，粒子不在岛正上方。
   */
  const bounds = useMemo(() => {
    let mx = 6;
    let mz = 6;
    for (const t of tiles) {
      mx = Math.max(mx, Math.abs(t.x));
      mz = Math.max(mz, Math.abs(t.z));
    }
    return { mx, mz };
  }, [tiles]);

  /** 岛的最高点：天气粒子从它上方开始落、落到它为止（所以雨雪只在小岛上空） */
  const canopy = useMemo(() => tiles.reduce((m, t) => Math.max(m, t.h), 0), [tiles]);

  /** 岛的实际半径（格为单位）—— 相机与缩放按它自适应，避免岛大了被裁、小了看不清 */
  const radius = useMemo(() => {
    let r = 6;
    for (const t of tiles) r = Math.max(r, Math.hypot(t.x, t.z));
    return r;
  }, [tiles]);

  return (
    <>
      {/*
        三点布光：环境光只垫到背光面不死黑，主光在右上决定顶面/侧面明暗差（等距立体感全靠它），
        补光在左下并染成场景主色 —— 暗面泛出当前场景色调，整座岛和页面同一气氛。
      */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[14, 22, 12]} intensity={1.3} />
      <directionalLight position={[-14, 6, -12]} intensity={0.55} color={palette.roof} />

      <FitCamera radius={radius} />

      {/*
        岛心已在原点，直接绕 Y 轴转即可，不需要再套两层平移做 C·R·C⁻¹（那会一转就甩出画面）；
        绕 Y +90° 在等距俯视下投影到屏幕恰好是顺时针 90°，四个方向都居中。
      */}
      <Rise>
      <group rotation={[0, (rotate * Math.PI) / 2, 0]}>
        {/* 整片地形合并成一次 draw call，见 Tiles */}
        <Tiles tiles={tiles} palette={palette} bob={bob} cap={cap} />

            {/* 装饰物摆在顶面（y = h），建筑格的 deco 已在模型层清零，不会树穿房子；按「部件」实例化，见 Decorations */}
            <Decorations tiles={tiles} palette={palette} />

            {buildings.map((n) => (
              <BuildingNodeView key={n.b.id} node={n} palette={palette} />
            ))}
      </group>
      </Rise>

      {/* 天气粒子不跟着岛转 —— 天气是世界坐标里的，转视角时雨雪不该跟着甩 */}
      <Weather kind={weather} mx={bounds.mx} mz={bounds.mz} canopy={canopy} />

      {/*
        刻意不加底板、海面、背景色和 fog：Canvas 走 alpha 通道（见 gl.alpha），岛直接浮在页面场景照片上。
        也不放 ContactShadows —— 阴影贴图平面在透明画布上会读成一块灰色方块，像"后面有个画布"。
      */}

      {/* 禁止缩放与平移：岛的大小是设计好的固定值，只保留拖动旋转（绕 Y 轴看四个方向） */}
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        enableDamping={false}
        minPolarAngle={0.6}
        maxPolarAngle={1.35}
        target={[0, 1.6, 0]}
      />
    </>
  );
}

/* ------------------------------------------------------------------ *
 * 建筑
 * ------------------------------------------------------------------ */

/** 三种材质的粗糙度档位，避免在每个零件上重复写同一组数字 */
const SOLID = { roughness: 0.86, metalness: 0 } as const;
const GLOWY = { roughness: 0.6, metalness: 0 } as const;
const LEAFY = { roughness: 0.8, metalness: 0 } as const;

/**
 * 整片地形用 InstancedMesh 合并成一次 draw call（每块砖几何体相同，只有位置 / 高度 / 颜色不同）。
 * 颜色必须走 setColorAt，并且必须 frustumCulled={false} —— 包围球不含实例偏移，否则整片会被剔除。
 */
function Tiles({
  tiles,
  palette,
  bob,
  cap,
}: {
  tiles: TileGeom[];
  palette: Palette;
  bob: boolean;
  /** 柱顶是否加一层薄白雪 —— 参考图的招牌观感就是"深色柱身 + 白顶" */
  cap: boolean;
}) {
  const ref = useRef<InstancedMesh>(null);
  const capRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  /**
   * 每根柱子的固定相位由网格坐标推出 —— 不能用 Math.random，否则 SSR / CSR 不一致，hydration 会炸；
   * 相位不同，柱子才各自错落地浮，而不是整片一起上下。
   */
  const phases = useMemo(
    () => tiles.map((t) => (t.x * 1.7 + t.z * 2.3) % (Math.PI * 2)),
    [tiles],
  );

  const write = useCallback(
    (time: number, color?: Color) => {
      const mesh = ref.current;
      if (!mesh || tiles.length === 0) return;
      const capMesh = capRef.current;
      const c = color ?? new Color();
      tiles.forEach((t, i) => {
        const dy = bob ? Math.sin(time * 1.05 + phases[i]) * 0.22 : 0;
        const y = t.y + dy;
        dummy.position.set(t.x, y, t.z);
        dummy.scale.set(1, t.h, 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        mesh.setColorAt(i, c.set(palette[KIND_COLOR[t.kind]]));
        if (cap && capMesh) {
          // 雪盖贴在柱顶（柱顶 = 中心 + 半高），比柱子略宽一点才像"积上去的"
          dummy.position.set(t.x, y + t.h / 2 - 0.02, t.z);
          dummy.scale.set(1.03, 0.16, 1.03);
          dummy.updateMatrix();
          capMesh.setMatrixAt(i, dummy.matrix);
        }
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      if (cap && capMesh) capMesh.instanceMatrix.needsUpdate = true;
    },
    [tiles, phases, palette, dummy, bob, cap],
  );

  useLayoutEffect(() => {
    write(0);
    invalidate();
  }, [write]);

  // 悬浮是持续动画，只能逐帧改实例矩阵
  useFrame((state) => {
    if (!bob && !cap) return;
    write(state.clock.elapsedTime);
  });

  return (
    <>
      <instancedMesh ref={ref} args={[undefined, undefined, tiles.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        {/*
          不要加 vertexColors：会启用 USE_COLOR 去读几何体的 color 属性，而单位立方体没有该属性
          → vColor = 0，乘上 instanceColor 后整片地形全黑。instanceColor 走 USE_INSTANCING_COLOR，与它无关。
        */}
        <meshStandardMaterial roughness={0.92} metalness={0} />
      </instancedMesh>

      {cap ? (
        <instancedMesh ref={capRef} args={[undefined, undefined, tiles.length]} frustumCulled={false}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={0xf4f9fd} roughness={0.45} metalness={0} />
        </instancedMesh>
      ) : null}
    </>
  );
}

/** 一个实例的位置 / 缩放 / 旋转 */
type Part = {
  p: [number, number, number];
  s?: [number, number, number];
  r?: [number, number, number];
};

/** 同一「部件」的所有实例合并成一个 InstancedMesh；同 Tiles 必须 frustumCulled={false} */
function PartMesh({ items, color, children }: { items: Part[]; color: number; children: ReactNode }) {
  const ref = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh || items.length === 0) return;
    const dummy = new Object3D();
    items.forEach((it, i) => {
      dummy.position.set(...it.p);
      dummy.scale.set(...(it.s ?? [1, 1, 1]));
      dummy.rotation.set(...(it.r ?? [0, 0, 0]));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    invalidate();
  }, [items]);

  // 这个模块没有实例时直接不渲染（hooks 已经在上面调用过，位置合法）
  if (items.length === 0) return null;

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, items.length]} frustumCulled={false}>
      {children}
      <meshStandardMaterial color={color} roughness={0.88} metalness={0} />
    </instancedMesh>
  );
}

/**
 * 装饰物按「部件」实例化：5 个 InstancedMesh 覆盖树干 / 两层树冠 / 石头 / 蕨叶，全部是基础几何体，
 * 不加载模型文件。颜色按部件统一（树干暗色、树冠主色），所以不需要 instanceColor。
 */
function Decorations({ tiles, palette }: { tiles: TileGeom[]; palette: Palette }) {
  const parts = useMemo(() => {
    const trunk: Part[] = [];
    const coneLo: Part[] = [];
    const coneHi: Part[] = [];
    const rock: Part[] = [];
    const blade: Part[] = [];

    for (const t of tiles) {
      if (t.deco === 0) continue;
      const yaw = t.decoV * 1.1;
      if (t.deco === 1) {
        // 针叶树：树干 + 两层锥，对应 2D 里那棵双三角的树
        const s = 0.85 + (t.decoV % 3) * 0.16;
        trunk.push({ p: [t.x, t.h + 0.34 * s, t.z], s: [s, s, s] });
        coneLo.push({ p: [t.x, t.h + 0.78 * s, t.z], s: [s, s, s], r: [0, yaw, 0] });
        coneHi.push({ p: [t.x, t.h + 1.34 * s, t.z], s: [s, s, s], r: [0, yaw, 0] });
      } else if (t.deco === 2) {
        rock.push({ p: [t.x, t.h + 0.15 * s0(t), t.z], s: [0.34 * s0(t), 0.22 * s0(t), 0.3 * s0(t)], r: [0, yaw, 0] });
      } else {
        // 蕨：三片细长的叶呈扇形张开（竖直叶片 + 左右各倾一点）
        const s = 0.8 + (t.decoV % 3) * 0.12;
        for (const k of [-1, 0, 1]) {
          blade.push({
            p: [t.x + Math.cos(yaw) * k * 0.13, t.h + 0.17, t.z + Math.sin(yaw) * k * 0.13],
            s: [0.055 * s, 0.36 * s, 0.19 * s],
            r: [0, 0, k * -0.55],
          });
        }
      }
    }
    return { trunk, coneLo, coneHi, rock, blade };
  }, [tiles]);

  return (
    <>
      <PartMesh items={parts.trunk} color={palette.dark}>
        <boxGeometry args={[0.14, 0.68, 0.14]} />
      </PartMesh>
      <PartMesh items={parts.coneLo} color={palette.roof}>
        <coneGeometry args={[0.5, 0.9, 6]} />
      </PartMesh>
      <PartMesh items={parts.coneHi} color={palette.roof}>
        <coneGeometry args={[0.34, 0.72, 6]} />
      </PartMesh>
      <PartMesh items={parts.rock} color={palette.rock}>
        <dodecahedronGeometry args={[1, 0]} />
      </PartMesh>
      <PartMesh items={parts.blade} color={palette.roof}>
        <coneGeometry args={[1, 1, 4]} />
      </PartMesh>
    </>
  );
}

/** 石头的尺寸系数 */
function s0(t: TileGeom): number {
  return 0.8 + (t.decoV % 3) * 0.14;
}

function BuildingNodeView({ node, palette }: { node: BuildingNode; palette: Palette }) {
  const { b } = node;
  const dim = !b.unlocked;
  // 未解锁 0.3 透明度（对齐 2D 版的 opacity={0.28}）；R3F 的 <group> 没有 opacity prop，只能写在材质上
  const fade = { transparent: dim, "material-opacity": dim ? 0.3 : 1 } as const;

  const body = (() => {
    switch (b.id) {
      case "lighthouse":
        return (
          <>
            <mesh position={[0, 1.2, 0]}>
              <cylinderGeometry args={[0.44, 0.62, 2.4, 10]} />
              <meshStandardMaterial color={palette.wall} {...SOLID} {...fade} />
            </mesh>
            <mesh position={[0, 2.6, 0]}>
              <boxGeometry args={[1.05, 0.42, 1.05]} />
              <meshStandardMaterial color={palette.dark} {...SOLID} {...fade} />
            </mesh>
            <mesh position={[0, 3.35, 0]}>
              <sphereGeometry args={[0.52, 14, 10]} />
              <meshStandardMaterial color={palette.roof} {...GLOWY} {...fade} />
            </mesh>
          </>
        );
      case "workshop":
        return (
          <>
            <mesh position={[0, 0.75, 0]}>
              <boxGeometry args={[2.7, 1.5, 2.1]} />
              <meshStandardMaterial color={palette.wall} {...SOLID} {...fade} />
            </mesh>
            <mesh position={[0, 1.95, 0]} rotation={[0, BUILDING_YAW, 0]}>
              <coneGeometry args={[1.85, 0.9, 4]} />
              <meshStandardMaterial color={palette.roof} {...SOLID} {...fade} />
            </mesh>
            <mesh position={[0.95, 1.35, 0.4]}>
              <boxGeometry args={[0.3, 1.6, 0.3]} />
              <meshStandardMaterial color={palette.wall2} {...SOLID} {...fade} />
            </mesh>
          </>
        );
      case "harbor":
        return (
          <>
            <mesh position={[0, 0.15, 0]}>
              <boxGeometry args={[3.6, 0.3, 1.9]} />
              <meshStandardMaterial color={palette.wall2} {...SOLID} {...fade} />
            </mesh>
            <mesh position={[-1.35, -0.65, 0]}>
              <boxGeometry args={[0.3, 1.6, 0.3]} />
              <meshStandardMaterial color={palette.dark} {...SOLID} {...fade} />
            </mesh>
            <mesh position={[1.35, -0.65, 0]}>
              <boxGeometry args={[0.3, 1.6, 0.3]} />
              <meshStandardMaterial color={palette.dark} {...SOLID} {...fade} />
            </mesh>
            {/* 小船侧躺：先绕 Z 轴放倒 90°，再转到面向镜头的方向 */}
            <mesh position={[1.5, 0.85, 0.9]} rotation={[0, BUILDING_YAW, Math.PI / 2]}>
              <coneGeometry args={[0.55, 1.3, 8]} />
              <meshStandardMaterial color={palette.roof} {...SOLID} {...fade} />
            </mesh>
          </>
        );
      case "camp":
        return (
          <>
            <mesh position={[0, 0.75, 0]} rotation={[0, BUILDING_YAW, 0]}>
              <coneGeometry args={[1.5, 1.5, 4]} />
              <meshStandardMaterial color={palette.roof} {...SOLID} {...fade} />
            </mesh>
            <mesh position={[1.3, 0.2, 0]}>
              <sphereGeometry args={[0.46, 12, 8]} />
              <meshStandardMaterial color={palette.soft} {...GLOWY} {...fade} />
            </mesh>
          </>
        );
      case "garden":
        return (
          <>
            <mesh position={[0, -0.5, 0]}>
              <boxGeometry args={[2.7, 1.5, 2.1]} />
              <meshStandardMaterial color={palette.wall2} {...SOLID} {...fade} />
            </mesh>
            {[-0.72, 0, 0.72].map((dx, i) => (
              <mesh key={`bush${i}`} position={[dx, 0.6, i === 1 ? -0.25 : 0.25]}>
                <sphereGeometry args={[0.5, 12, 8]} />
                <meshStandardMaterial color={palette.roof} {...LEAFY} {...fade} />
              </mesh>
            ))}
          </>
        );
      default:
        // library
        return (
          <>
            <mesh position={[0, 0.75, 0]}>
              <boxGeometry args={[2.7, 1.5, 2.1]} />
              <meshStandardMaterial color={palette.wall} {...SOLID} {...fade} />
            </mesh>
            <mesh position={[0, 1.75, 0]} rotation={[0, BUILDING_YAW, 0]}>
              <coneGeometry args={[1.8, 1.1, 4]} />
              <meshStandardMaterial color={palette.roof} {...SOLID} {...fade} />
            </mesh>
            <mesh position={[0, 0.35, 1.02]} scale={[0.9, 0.9, 0.4]}>
              <boxGeometry args={[0.3, 1.6, 0.3]} />
              <meshStandardMaterial color={palette.dark} {...SOLID} {...fade} />
            </mesh>
          </>
        );
    }
  })();

  /**
   * 悬停 / 点击。抬升刻意不用 useFrame 做阻尼：画布是 frameloop="demand"，没有持续帧，
   * useFrame 的逐帧动画根本不会跑；用状态驱动 position，状态一变正好出一帧。
   */
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const router = useRouter();
  const lift = hovered && node.b.unlocked ? 0.45 : 0;
  // 等级 1/2/3 → 尺寸 1.0/1.18/1.36；步长刻意小，1.5× 那版建筑会互相压叠、树从房顶穿出来
  const scale = (1 + (node.b.level - 1) * 0.18) * (pressed ? 0.88 : 1);

  return (
    <group
      position={[node.x, node.ground - BUILDING_BASE[node.b.id] + lift, node.z]}
      rotation={[0, -BUILDING_YAW, 0]}
      scale={scale}
      onClick={(e) => {
        if (!node.b.unlocked) return;
        e.stopPropagation();
        // 点击回弹：先缩，再跳转。React 18 之后卸载后 setState 不再告警，所以不用额外清理
        setPressed(true);
        window.setTimeout(() => setPressed(false), 170);
        router.push(node.b.href);
      }}
      onPointerOver={(e) => {
        if (!node.b.unlocked) return;
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "default";
      }}
    >
      {body}
    </group>
  );
}

/* ------------------------------------------------------------------ *
 * 入口
 * ------------------------------------------------------------------ */

/**
 * 正交相机的 zoom 不能写死：可见高度 = 画布高 / zoom，取决于运行时画布尺寸，按岛的实际包围球反解。
 * FILL_V 管竖向、FILL_H 管横向 —— 只按高度算的话，窄屏可见宽度小于岛宽，两边会被裁掉。
 */
const FILL_V = 2.35;
const FILL_H = 3.4;

/** 小岛自己的"场景"（与全站场景独立，可在岛上单独换） */
export type IslandSkin = "auto" | "snow" | "forest" | "dusk";

/**
 * 小岛换装：在场景令牌色板之上再混一层，而不是另写一套色板 —— 令牌那套跟着全站场景走，
 * 这里只做加权混合（雪境往白里混、暖云往暖橙混、雨林原样），用 three 的 Color.lerp。
 */
function applySkin(p: Palette, skin: IslandSkin): Palette {
  if (skin === "auto" || skin === "forest") return p;
  const target = skin === "snow" ? 0xf2f7fb : 0xffb066;
  const t = skin === "snow" ? 0.8 : 0.44;
  const mix = (c: number) => new Color(c).lerp(new Color(target), t).getHex();
  return {
    grass: mix(p.grass),
    rock: mix(p.rock),
    sand: mix(p.sand),
    wall: mix(p.wall),
    wall2: mix(p.wall2),
    // 树冠和屋顶在雪境里直接给近白，才能像参考图那样"白树白顶"
    roof: skin === "snow" ? 0xf7fafd : mix(p.roof),
    // 柱子侧面在雪境里压深一点，和白雪拉开对比（参考图就是深柱白顶）
    dark: skin === "snow" ? new Color(p.dark).lerp(new Color(0x2c3a4c), 0.55).getHex() : mix(p.dark),
    soft: mix(p.soft),
  };
}

export type IslandWeather = "clear" | "rain" | "leaves" | "snow";

/**
 * 天气粒子：一份代码 + 一张参数表，雨 / 雪 / 落叶只差几何尺寸、颜色、速度、飘幅、自转。
 * 位置由时间直接算出、不累加状态（无漂移）；初始分布由下标哈希而来，不能用 Math.random（SSR / CSR 必须一致）。
 */
const WEATHER_SPEC = {
  clear: { count: 0, size: [0.1, 0.1, 0.1], fall: 0, sway: 0, spin: 0, hold: 0, tint: null, colors: null },
  // 雨 / 雪各自定色，不取 palette.soft —— 那会跟着场景令牌走，雨林场景下"雪"是黄绿色的
  rain: { count: 900, size: [0.025, 0.6, 0.025], fall: 16, sway: 0.3, spin: 0, hold: 0, tint: 0x8fbdf0, colors: null },
  snow: { count: 760, size: [0.14, 0.14, 0.14], fall: 1.7, sway: 1.15, spin: 0.9, hold: 0.3, tint: 0xffffff, colors: null },
  leaves: {
    count: 280,
    size: [0.42, 0.035, 0.3],
    fall: 1.45,
    sway: 1.8,
    spin: 2.6,
    hold: 0.34,
    tint: null, // 落叶走 instanceColor，材质色必须是白的
    // 秋色：赭石 / 赤褐 / 金黄 / 暗红
    colors: [0xe0873a, 0xc25f2a, 0xd8a63f, 0xa8471f] as number[] | null,
  },
} as const satisfies Record<
  IslandWeather,
  {
    count: number;
    size: readonly [number, number, number];
    fall: number;
    sway: number;
    spin: number;
    /** 落地后停留的时间占比（0 = 一碰就走） */
    hold: number;
    /** 固定颜色；null = 用 instanceColor */
    tint: number | null;
    colors: number[] | null;
  }
>;

const WEATHER_TOP = 22;
const WEATHER_BOTTOM = -7;

/**
 * 整数哈希 → [0,1)。必须用会真正溢出的混合，不能用 `i * 小常数` —— 那样乘积永不溢出，
 * 会退化成一条近似常数斜坡，所有粒子的第二维落回同一侧（曾表现为整片落叶挤在画面一边）。
 */
function hash(n: number): number {
  let x = (n + 0x9e3779b9) >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x21f0aaad) >>> 0;
  x ^= x >>> 15;
  x = Math.imul(x, 0x735a2d97) >>> 0;
  x ^= x >>> 15;
  return x / 4294967296;
}

function Weather({
  kind,
  mx,
  mz,
  canopy,
}: {
  kind: IslandWeather;
  /** 岛的 x 半宽 */
  mx: number;
  /** 岛的 z 半深 */
  mz: number;
  /** 岛的最高点（树冠/塔尖），粒子就从它上方开始落、落到它为止 */
  canopy: number;
}) {
  const spec = WEATHER_SPEC[kind];
  const ref = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const color = useMemo(() => new Color(), []);

  const parts = useMemo(() => {
    const n = spec.count;
    // 按矩形足迹分轴撒（x / z 各自的半宽），用对角半径会把粒子撒到岛外
    const ax = Math.max(4, mx * 0.98);
    const az = Math.max(4, mz * 0.98);
    return Array.from({ length: n }, (_, i) => {
      // 三个互不相关的哈希：位置 x / 位置 z / 初始高度（顺带决定颜色索引）
      const h1 = hash(i * 3);
      const h2 = hash(i * 3 + 1);
      const h3 = hash(i * 3 + 2);
      return {
        x: (h1 * 2 - 1) * ax,
        z: (h2 * 2 - 1) * az,
        y0: h3 * (WEATHER_TOP - WEATHER_BOTTOM),
        phase: h1 * Math.PI * 2,
        ci: Math.floor(h3 * (spec.colors?.length ?? 1)),
      };
    });
  }, [spec, mx, mz]);

  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh || parts.length === 0 || spec.fall === 0) return;
    const t = state.clock.elapsedTime;
    /**
     * 只在小岛上空活动：起点在树冠上方 RANGE 单位，落到树冠上方一点点（不穿到岛下面去），
     * 停留 hold 占比的时间后再回起点。整段仍由时间直接算出（u 取小数部分循环），无漂移。
     */
    const RANGE = 6.5;
    const ground = canopy + 0.7;
    const fallEnd = 1 / (1 + spec.hold);
    const period = (RANGE / spec.fall) * (1 + spec.hold);
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      const u = p.y0 + t / period;
      const frac = u - Math.floor(u);
      const falling = frac < fallEnd;
      const y = falling ? ground + RANGE * (1 - frac / fallEnd) : ground;
      // 落地就不再横向飘，否则雪会贴着柱顶来回蹭
      const sway = falling ? Math.sin(t * 0.9 + p.phase) * spec.sway : 0;
      const drift = falling ? Math.cos(t * 0.72 + p.phase) * spec.sway : 0;
      dummy.position.set(p.x + sway, y, p.z + drift);
      dummy.rotation.set(
        spec.spin ? t * spec.spin + p.phase : 0,
        spec.spin ? t * spec.spin * 0.63 : 0,
        spec.spin ? p.phase : 0,
      );
      dummy.scale.set(spec.size[0], spec.size[1], spec.size[2]);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      if (spec.colors) mesh.setColorAt(i, color.set(spec.colors[p.ci]));
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  if (parts.length === 0) return null;

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, parts.length]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      {/* 有 instanceColor 时材质色要是白的，否则会把每片叶子的颜色乘暗 */}
      <meshStandardMaterial
        color={spec.tint ?? 0xffffff}
        roughness={kind === "snow" ? 0.35 : 0.8}
        metalness={0}
        transparent
        opacity={kind === "rain" ? 0.55 : 0.95}
      />
    </instancedMesh>
  );
}

/** 正交取景：把按包围球解出的 zoom 写进相机（画布固定高度，桌面端这一项是常数） */
function FitCamera({ radius }: { radius: number }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  useEffect(() => {
    /* eslint-disable react-hooks/immutability -- 正交缩放只能命令式设置：
       R3F 的 camera 是 three 的实例，改 zoom 后调 updateProjectionMatrix 是官方做法，
       没有声明式的等价写法（把它做成 state 反而会每帧重建相机）。 */
    // 不引 three 的类型命名空间（这个文件刻意只依赖 R3F 的声明式组件），用结构类型判断
    const cam = camera as unknown as {
      isOrthographicCamera?: boolean;
      zoom: number;
      updateProjectionMatrix: () => void;
    };
    if (!cam.isOrthographicCamera) return;

    const wantV = Math.max(6, radius * FILL_V);
    const wantH = Math.max(8, radius * FILL_H);
    const next = Math.min(size.height / wantV, size.width / wantH);
    if (Math.abs(cam.zoom - next) < 0.01) return;
    cam.zoom = next;
    cam.updateProjectionMatrix();
    // demand 模式下没有持续帧，必须显式要求重画一次，否则改了 zoom 也看不到
    invalidate();
    /* eslint-enable react-hooks/immutability */
  }, [camera, size.height, size.width, radius]);

  return null;
}

/**
 * 入场动画：整座岛从下方升起。位移必须逐帧插值、只能用 useFrame，所以画布必须是 frameloop="always"。
 * 指数趋近（每帧缩小剩余差距）天然是 ease-out，且不依赖帧率，掉帧时也不会走形。
 */
function Rise({ children }: { children: ReactNode }) {
  const ref = useRef<Group>(null);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    g.position.y += (0 - g.position.y) * Math.min(1, dt * 3.4);
    if (Math.abs(g.position.y) < 0.005) g.position.y = 0;
  });
  return (
    <group ref={ref} position={[0, -7.5, 0]}>
      {children}
    </group>
  );
}

export function KnowledgeIsland3D({
  stats,
  rotate = 0,
  bob = true,
  skin = "auto",
  weather = "clear",
  className,
}: {
  stats: IslandStats;
  /** 0..3，四个等距方向，由父组件传进来 */
  rotate?: number;
  /** 柱子是否自动上下悬浮（默认开） */
  bob?: boolean;
  /** 小岛自己的场景（换装） */
  skin?: IslandSkin;
  /** 天气：晴 / 雨 / 落叶 / 下雪 */
  weather?: IslandWeather;
  className?: string;
}) {
  /**
   * 渲染时机三态：pending = 未挂载（输出占位，与 SSR 一致）/ ready = 有 WebGL / unavailable = 没有。
   * 必须挂载后才探测：服务端没有 window，渲染期读 document 会被 react-hooks/purity 拦下。
   */
  const [capability, setCapability] = useState<"pending" | "ready" | "unavailable">("pending");
  const basePalette = usePalette();
  const palette = useMemo(() => applySkin(basePalette, skin), [basePalette, skin]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- 客户端能力探测只能在挂载后做：
       服务端没有 WebGL，渲染期读 document 又会被 react-hooks/purity 拦；首帧必须与 SSR
       输出一致，因此这次 setState 正是「订阅外部系统后回填状态」的标准写法。 */
    try {
      const canvas = document.createElement("canvas");
      setCapability(canvas.getContext("webgl2") ? "ready" : "unavailable");
    } catch {
      // 有些浏览器禁用 WebGL 时直接抛异常，而不是返回 null
      setCapability("unavailable");
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const ready = capability === "ready";

  return (
    <div className={cn("relative w-full", className)}>
      {/* 容器必须有确定高度，否则 R3F 的 canvas 会塌成浏览器默认的 300×150（h-full 在父级无高度时算出来是 auto）；
          这里用固定高度而不是 aspect-ratio 随视口变，岛的大小才是设计好的固定值 */}
      <div className="h-[520px] w-full sm:h-[660px]">
        {ready ? (
          <Canvas
            /**
             * `orthographic` 这个开关是必须的：光在 camera 里给 zoom 不会把相机变成正交 ——
             * R3F 只会把它套在默认的 PerspectiveCamera 上，而 zoom 对透视相机无效。
             */
            orthographic
            camera={{ position: CAMERA_POSITION, zoom: CAMERA_ZOOM_INITIAL, near: 0.1, far: 400 }}
            dpr={[1, 1.8]}
            /**
             * 常开 always：柱子是持续上下悬浮的，必须逐帧改实例矩阵 —— demand 模式下没有帧，
             * useFrame 一帧都不会跑，悬浮和入场升起就都没了。
             */
            frameloop="always"
            shadows={false}
            gl={{ antialias: true, alpha: true }}
            style={{ touchAction: "none" }}
          >
            <Scene
              stats={stats}
              rotate={rotate}
              palette={palette}
              bob={bob}
              weather={weather}
              cap={skin === "snow" || weather === "snow"}
            />
          </Canvas>
        ) : (
          // 兜底：没挂载完或没有 WebGL 时给一个不会崩的占位，而不是白屏
          <div
            className="flex h-full w-full items-center justify-center rounded-lg border border-border bg-surface text-[12px] text-muted-fg"
            role="img"
            aria-label="知行岛 3D 视图需要开启 WebGL 才能显示"
          >
            {capability === "unavailable" ? "当前浏览器未启用 WebGL，无法显示 3D 知行岛" : ""}
          </div>
        )}
      </div>
    </div>
  );
}
