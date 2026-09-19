/**
 * 场景背板配置。
 *
 * 这里是**唯一**要改的地方。`public/scenic/` 下已放好 5 张实景照片（白云岩 Dolomites），
 * 每个场景有一个默认背景，用户还能在 `/settings → 场景背景` 里逐场景改选（可选另一张预设、
 * 换回内置矢量场景、或自己上传）。
 *
 * 关于裁切：这几张都是**竖构图**（~1440×1800），而背板层是 `background-size: cover`，
 * 所以在宽屏上会纵向裁掉约一半。每张的 `pos` 就是为此调的 —— 让主体（岩峰/林线）
 * 落在安全区、底部留给文字。换图后如果主体被裁掉，改这一项即可。
 *
 * ⚠️ 不要直接把第三方图床地址填进来当外链：Chromium 的 ORB 会静默拦截热链图片
 * （net::ERR_BLOCKED_BY_ORB），首屏变灰白且控制台不一定报错。图必须自托管在 public/。
 */

export type ScenicPresetId =
  | "forest-church"
  | "lake-boat"
  | "meadow-church"
  | "rock-hotel"
  | "cave-towers"
  | "como-terrace"
  | "sunset-desk";

export type ScenicScene = "rain" | "snow" | "cloud";

export interface ScenicPreset {
  id: ScenicPresetId;
  /** 设置页里显示的名字 */
  label: string;
  src: string;
  /** 适合哪个场景（仅作提示，不强制） */
  mood: string;
  /** background-position：竖构图裁切的调节旋钮 */
  pos: string;
  /** 一句中文点出主体与意境（skill §2） */
  alt: string;
}

export const SCENIC_PRESETS: ScenicPreset[] = [
  {
    id: "forest-church",
    label: "云杉林 · 林间小教堂",
    src: "/scenic/forest-church.webp",
    mood: "深绿 · 配雨林",
    pos: "center 58%",
    alt: "晨光下的云杉林山坡与林间小教堂，绿意层层叠叠",
  },
  {
    id: "lake-boat",
    label: "冷蓝湖面 · 独木舟",
    src: "/scenic/lake-boat.webp",
    mood: "冷蓝 · 配雪境",
    pos: "center 62%",
    alt: "冷蓝色湖面与远处岩峰，湖畔木屋旁停着一条独木舟",
  },
  {
    id: "meadow-church",
    label: "金色草甸 · 翻涌云层",
    src: "/scenic/meadow-church.webp",
    mood: "暖金 · 配暖云",
    pos: "center 42%",
    alt: "暖金色夕照下的草甸与锯齿状岩峰，云层翻涌",
  },
  {
    id: "rock-hotel",
    label: "岩壁 · 湖畔黄色旅馆",
    src: "/scenic/rock-hotel.webp",
    mood: "灰调 · 冷峻",
    pos: "center 50%",
    alt: "巨大灰色岩壁下临湖的黄色旅馆，山体阴影浓重",
  },
  {
    id: "cave-towers",
    label: "洞窟 · 框住的三座石峰",
    src: "/scenic/cave-towers.webp",
    mood: "暗框 · 强纵深",
    pos: "center 45%",
    alt: "岩洞洞口框住远处的三座石峰，明暗对比强烈",
  },
  {
    id: "como-terrace",
    label: "科莫湖 · 树影下的露台",
    src: "/scenic/como-terrace.webp",
    mood: "青绿 · 通透",
    // 已从竖构图裁成 16:9 横构图（1440×810）：湖面占上部、露台在下部，
    // 横构图下 cover 的裁切很小，pos 回到 center 即可
    pos: "center 50%",
    alt: "树影下的湖畔露台，青绿色湖面停着几条小船，露台上有绿篱与橙色遮阳伞",
  },
  {
    id: "sunset-desk",
    label: "日落之城 · 窗外",
    src: "/scenic/sunset-desk.webp",
    mood: "暖橙 · 生活感",
    pos: "center 50%",
    alt: "黄昏的窗景：桌上屏幕亮着，窗外是大片绿地与远处的城市天际线",
  },
];

export const SCENIC_PRESET_BY_ID: Record<ScenicPresetId, ScenicPreset> = SCENIC_PRESETS.reduce(
  (acc, p) => {
    acc[p.id] = p;
    return acc;
  },
  {} as Record<ScenicPresetId, ScenicPreset>,
);

/** 每个场景的默认背景（可在设置里改） */
export const SCENIC_DEFAULT: Record<ScenicScene, ScenicPresetId> = {
  rain: "forest-church",
  snow: "lake-boat",
  cloud: "meadow-church",
};

export const SCENIC_SCENES: ScenicScene[] = ["rain", "snow", "cloud"];

export const SCENIC_SCENE_LABEL: Record<ScenicScene, string> = {
  rain: "雨林",
  snow: "雪境",
  cloud: "暖云",
};

/** localStorage 键名（不要改，改了用户已存的选择会丢） */
export const scenicKeys = (scene: ScenicScene) => ({
  /** 已解析好的背景值：图片路径，或 "none"（用内置矢量场景） */
  bg: `scenicBg_${scene}`,
  /** background-position */
  pos: `scenicBgPos_${scene}`,
  /** 用户的选择：预设 id / "svg"（内置矢量）/ "custom"（自己传的） */
  pick: `scenicPick_${scene}`,
  /** 自己上传的图片地址 */
  custom: `scenicCustom_${scene}`,
});

/** 背景总开关 */
export const SCENIC_OFF_KEY = "scenicOff";

/** 供 inline style 用的默认值：CSS 变量优先，否则落到该场景的默认预设 */
export function scenicDefaultLayer(scene: ScenicScene) {
  const p = SCENIC_PRESET_BY_ID[SCENIC_DEFAULT[scene]];
  return {
    backgroundImage: `var(--scenic-bg-${scene}, url(${p.src}))`,
    backgroundPosition: `var(--scenic-bg-pos-${scene}, ${p.pos})`,
  };
}
