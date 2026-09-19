/**
 * 知行岛 · 模型层（纯函数、确定性）：把知识库 / 文档 / 片段 / 对话 / 简历 / 职位的计数折算成
 * 一座等距小岛的地形与建筑。全部确定性 —— 不用 Math.random 而用固定种子的 mulberry32，
 * 否则服务端与客户端算出来不一样，hydration 会报错。隐喻：积累越多，岛越大、地势越高、建筑越全。
 */

export type IslandStats = {
  kb: number;
  doc: number;
  chunk: number;
  conv: number;
  resume: number;
  job: number;
  /** 最近 7 天内有活动的天数（0-7），用来决定天气 */
  activeDays: number;
  /** 第一个知识库的 id。有它「图书馆」才能直接进那一个库，否则建筑会全都指向 /dashboard */
  primaryKbId?: string;
};

export type TileKind = "grass" | "rock" | "sand";

export type IslandTile = {
  gx: number;
  gz: number;
  /** 海拔（像素，用于挤出柱体） */
  h: number;
  kind: TileKind;
  /** 装饰物种类：0 无 / 1 树 / 2 石 / 3 蕨 */
  deco: number;
  /** 装饰物用第几号变体（画法微差） */
  decoV: number;
  /** 在解锁顺序里的序号（0 = 最早解锁）。用来判断哪些是"这次新长出来的"，好放星火 */
  order: number;
};

export type BuildingKind = "library" | "lighthouse" | "workshop" | "harbor" | "camp" | "garden";

export type IslandBuilding = {
  id: BuildingKind;
  name: string;
  /** 一句话说明它是干什么的 */
  role: string;
  href: string;
  /** 当前数值的展示文案 */
  stat: string;
  unlocked: boolean;
  /** 未解锁时的条件说明 */
  need: string;
  /**
   * 等级 1 / 2 / 3，由对应数值的阈值决定，渲染层据此把建筑放大。
   * 只看阈值、不看连续值，避免每次刷新都算出一个新尺寸。
   */
  level: number;
  gx: number;
  gz: number;
};

export type Island = {
  tiles: IslandTile[];
  buildings: IslandBuilding[];
  /** 总格数 / 已解锁格数 */
  total: number;
  unlocked: number;
  /** 成长分（用于展示"距离下一格还差多少"） */
  score: number;
  /** 再获得多少分解锁下一格 */
  toNext: number;
  weather: "clear" | "cloudy";
  /** 岛的故事感标题 */
  stage: string;
};

export const GRID_X = 21;
export const GRID_Z = 15;
/** 新用户最少给这么多格，保证一看就是"一座岛"而不是一块石头 */
const BASE_TILES = 54;

/** mulberry32：小而稳的确定性伪随机 */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 成长分：各维度权重不同 —— 知识库与简历最重，职位最轻 */
export function growthScore(s: IslandStats): number {
  return (
    s.kb * 10 +
    Math.min(s.doc, 400) * 3 +
    Math.min(s.chunk, 6000) * 0.15 +
    s.conv * 2 +
    s.resume * 8 +
    Math.min(s.job, 400) * 0.6
  );
}

const STAGES: [number, string][] = [
  [0, "刚露出水面的礁石"],
  [60, "一小片可以落脚的沙洲"],
  [180, "开始长草的岛"],
  [400, "有了第一座建筑的岛"],
  [800, "有图书馆与灯塔的岛"],
  [1500, "热闹的知行岛"],
];

export function buildIsland(s: IslandStats): Island {
  const score = growthScore(s);
  const total = GRID_X * GRID_Z;
  // 分数 → 解锁格数：184 分左右解锁一半，之后递减（越往后越难）
  const unlocked = Math.max(
    BASE_TILES,
    Math.min(total, Math.round(BASE_TILES + (total - BASE_TILES) * (1 - Math.exp(-score / 700)))),
  );

  const cx = (GRID_X - 1) / 2;
  const cz = (GRID_Z - 1) / 2;
  const maxDist = Math.hypot(cx, cz);

  // 每格一个稳定的随机扰动，保证"长得自然"而不是同心圆
  const rnd = mulberry32(0x9e3779b9);
  const jitter = new Map<string, number>();
  for (let gx = 0; gx < GRID_X; gx++) {
    for (let gz = 0; gz < GRID_Z; gz++) {
      jitter.set(`${gx},${gz}`, rnd());
    }
  }

  // 解锁顺序：先中心、后外圈，叠加扰动 → 有机地从中心长出去
  const ordered: { gx: number; gz: number; key: number }[] = [];
  for (let gx = 0; gx < GRID_X; gx++) {
    for (let gz = 0; gz < GRID_Z; gz++) {
      const d = Math.hypot(gx - cx, gz - cz) / maxDist;
      ordered.push({ gx, gz, key: d + (jitter.get(`${gx},${gz}`) ?? 0) * 0.42 });
    }
  }
  ordered.sort((a, b) => a.key - b.key || a.gz - b.gz || a.gx - b.gx);
  const unlockedSet = new Set(ordered.slice(0, unlocked).map((t) => `${t.gx},${t.gz}`));
  const orderMap = new Map<string, number>();
  ordered.forEach((t, idx) => orderMap.set(`${t.gx},${t.gz}`, idx));

  const drnd = mulberry32(0x51ed270b);
  const tiles: IslandTile[] = [];
  for (let gx = 0; gx < GRID_X; gx++) {
    for (let gz = 0; gz < GRID_Z; gz++) {
      const key = `${gx},${gz}`;
      if (!unlockedSet.has(key)) continue;

      const dx = (gx - cx) / maxDist;
      const dz = (gz - cz) / maxDist;
      const dist = Math.hypot(dx, dz);
      // 中心隆起：中间高、边缘低，叠加两层噪声
      const n1 = (drnd() - 0.5) * 0.5;
      const n2 = (drnd() - 0.5) * 0.22;
      const bulge = Math.pow(Math.max(0, 1 - dist), 1.5);
      const h = Math.round(10 + bulge * 62 + n1 * 16 + n2 * 10);

      const edge = dist > 0.78;
      const kind: TileKind = edge && h < 22 ? "sand" : h > 52 ? "rock" : "grass";

      // 装饰：地势太陡/太靠边就不放
      const r = drnd();
      let deco = 0;
      let decoV = 0;
      if (!edge && h < 66) {
        if (r < 0.3) deco = 1;
        else if (r < 0.42) deco = 2;
        else if (r < 0.54) deco = 3;
      }
      decoV = Math.floor(drnd() * 3);

      tiles.push({ gx, gz, h, kind, deco, decoV, order: orderMap.get(key) ?? 0 });
    }
  }

  const baseBuildings: Omit<IslandBuilding, "level">[] = [
    {
      id: "camp",
      name: "营地",
      role: "上传第一个文档，才算真正踏上这座岛",
      href: "/dashboard",
      stat: `${s.doc} 个文档`,
      unlocked: s.doc >= 1,
      need: "上传 1 个文档",
      gx: 5,
      gz: 7,
    },
    {
      id: "library",
      name: "图书馆",
      role: "你的知识库都在这里，提问也从这里出发",
      // 有知识库就直接进第一个；没有才退回控制台去建
      href: s.primaryKbId ? `/kb/${s.primaryKbId}` : "/dashboard",
      stat: `${s.kb} 个知识库`,
      unlocked: s.kb >= 1,
      need: "创建 1 个知识库",
      gx: 7,
      gz: 5,
    },
    {
      id: "lighthouse",
      name: "灯塔",
      role: "有问题就点亮它 —— 通用智能体替你查、算、写",
      href: "/agent",
      stat: `${s.conv} 次对话 · ${s.chunk} 个片段`,
      unlocked: s.conv >= 1,
      need: "发起 1 次提问",
      gx: 10,
      gz: 4,
    },
    {
      id: "workshop",
      name: "工坊",
      role: "简历工坊：8 套模板 + 智能体改简历",
      href: "/resume",
      stat: `${s.resume} 份简历`,
      unlocked: s.resume >= 1,
      need: "保存 1 份简历",
      gx: 3,
      gz: 5,
    },
    {
      id: "harbor",
      name: "码头",
      role: "职位库与模拟面试，船从这里开出去",
      href: "/jobs",
      stat: `${s.job} 个职位`,
      unlocked: s.job >= 1,
      need: "录入 1 个职位",
      gx: 11,
      gz: 7,
    },
    {
      id: "garden",
      name: "园圃",
      role: "知识片段攒够 50 个，园子就起来了 —— 对应的成就在这里",
      href: "/achievements",
      stat: `${s.chunk} 个片段`,
      unlocked: s.chunk >= 50,
      need: "累计 50 个知识片段",
      gx: 8,
      gz: 8,
    },
  ];

  const lv = (v: number, t1: number, t2: number) => (v >= t2 ? 3 : v >= t1 ? 2 : 1);
  const levels: Record<BuildingKind, number> = {
    camp: lv(s.doc, 5, 15),
    library: lv(s.kb, 2, 5),
    lighthouse: lv(s.conv, 5, 20),
    workshop: lv(s.resume, 2, 5),
    harbor: lv(s.job, 10, 40),
    garden: lv(s.chunk, 200, 1000),
  };
  const buildings: IslandBuilding[] = baseBuildings.map((b) => ({ ...b, level: levels[b.id] }));

  // 建筑所在格必须已解锁（否则悬空）；没解锁就把该格强制解锁，保证建筑永远站得住
  const tileKeys = new Set(tiles.map((t) => `${t.gx},${t.gz}`));
  for (const b of buildings) {
    const key = `${b.gx},${b.gz}`;
    if (!tileKeys.has(key)) {
      tiles.push({ gx: b.gx, gz: b.gz, h: 26, kind: "grass", deco: 0, decoV: 0, order: -1 });
      tileKeys.add(key);
    }
  }
  // 建筑格不放装饰，免得树穿过房子
  for (const t of tiles) {
    if (buildings.some((b) => b.gx === t.gx && b.gz === t.gz)) t.deco = 0;
  }

  const stage = [...STAGES].reverse().find(([min]) => score >= min)?.[1] ?? STAGES[0][1];
  const perTile = 700 / (total - BASE_TILES);
  const toNext = Math.max(1, Math.ceil(perTile * (Math.exp(score / 520) * 1)));

  return {
    tiles,
    buildings,
    total,
    unlocked: tiles.length,
    score: Math.round(score),
    toNext,
    weather: s.activeDays >= 3 ? "clear" : "cloudy",
    stage,
  };
}

/** 等距投影：网格坐标 → 屏幕坐标（像素） */
export function project(gx: number, gz: number, tw = 46, th = 23) {
  return {
    x: (gx - gz) * (tw / 2),
    y: (gx + gz) * (th / 2),
  };
}

/**
 * 四个等距方向：把网格坐标按 90° 步进旋转。转的是逻辑网格坐标而不是给容器加 CSS transform ——
 * 这样等距投影、包围盒、建筑热点位置全部自动重算，不需要维护两套坐标。
 */
export function rotateCoords(gx: number, gz: number, rot: number): [number, number] {
  const r = ((rot % 4) + 4) % 4;
  switch (r) {
    case 1:
      return [gz, GRID_X - 1 - gx];
    case 2:
      return [GRID_X - 1 - gx, GRID_Z - 1 - gz];
    case 3:
      return [GRID_Z - 1 - gz, gx];
    default:
      return [gx, gz];
  }
}

/**
 * 最近 N 天里有几天有活动。刻意放在模型层：Date.now() 是不纯调用，直接在 Server Component 的
 * 渲染体里调会被 react-hooks/purity 拦下。领域计算本来就该在这一层。
 */
export function activeDaysFrom(dates: Date[], days = 7, now: number = Date.now()): number {
  const cutoff = now - days * 86400000;
  const set = new Set<string>();
  for (const d of dates) {
    if (d.getTime() >= cutoff) set.add(d.toISOString().slice(0, 10));
  }
  return set.size;
}

export const TILE_W = 46;
export const TILE_H = 23;
