/**
 * 新用户第一次打开看到的默认主题。
 *
 * 为什么单独放一个文件：默认场景同时被两处用到 —— 服务端渲染的 `<html data-scene>`（首帧）
 * 与 `layout.tsx` 里的 themeInit 内联脚本（客户端纠正）。默认主题色也被 themeInit 与
 * 设置页的主题色选择器共用。散着写迟早会漂，所以收在这里一处。
 *
 * ⚠️ 改动这里**不会影响已有用户**：他们 localStorage 里存了自己的选择，优先级更高。
 */

/** 默认场景：雨林 rain / 雪境 snow / 暖云 cloud */
export const DEFAULT_SCENE = "cloud" as const;

/**
 * 默认主题色。取值与设置页「主题色」里的琥珀一致。
 * 不设的话会跟随场景令牌（雨林绿 / 雪境蓝 / 暖云暖）。
 */
export const DEFAULT_ACCENT = {
  name: "琥珀",
  accent: "#d97706",
  hover: "#b45309",
  soft: "#fffbeb",
  softer: "#fef3c7",
  border: "#fde68a",
  deep: "#451a03",
} as const;
