/**
 * 快捷键的单一事实源：纯数据 + 纯函数，不碰 DOM、不碰 React。
 *
 * 为什么要抽出来单独放：
 *  1) `?` 面板的内容必须从**真实绑定**生成。手写一份说明列表，加一个键位就会漂移一次；
 *  2) 匹配与守卫是纯函数，可以脱离浏览器验证（`comboMatches` / `isTypingTarget`）；
 *  3) 原先 Ctrl+K（command-palette.tsx）、Esc（nav-menu.tsx / modal.tsx）各自
 *     `window.addEventListener`，键位散落三处、每个地方都要自己写一遍「正在打字就别抢键」。
 *
 * 这里只描述「按什么键、干什么、显示在哪一组」；真正的处理函数由组件通过
 * `useShortcut()` 注册 —— 组件挂载了那个键才生效，卸载就自动摘掉。
 */

export type Combo = {
  /** 与 KeyboardEvent.key 比较（大小写不敏感）。Esc 写 "escape"，空格写 " "。 */
  key: string;
  /** Ctrl（Windows/Linux）与 Cmd（macOS）视为同一类「命令键」，一份配置两边都能用 */
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
};

export type ShortcutDef = {
  id: string;
  combo: Combo;
  /** 面板里的一行说明 */
  label: string;
  /** 面板分组标题 */
  group: string;
  /** 在输入框里也生效？默认 false —— 正在打字时不该被抢键 */
  allowInTyping?: boolean;
};

/** 只取匹配必需的字段，方便在测试里直接造对象，不必构造真的 KeyboardEvent */
export type ShortcutEvent = {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
};

/**
 * 事件是否命中该组合键。
 * Ctrl 与 Cmd 归为一类：同一个 def 在 Windows 按 Ctrl、在 mac 按 Cmd 都命中。
 * 修饰键是**严格比较**的：要求「没按 Shift」的键位，按着 Shift 就不该触发。
 */
export function comboMatches(e: ShortcutEvent, combo: Combo): boolean {
  if (e.key.toLowerCase() !== combo.key.toLowerCase()) return false;
  const cmd = e.ctrlKey || e.metaKey;
  if (cmd !== Boolean(combo.ctrl)) return false;
  if (e.shiftKey !== Boolean(combo.shift)) return false;
  if (e.altKey !== Boolean(combo.alt)) return false;
  return true;
}

/**
 * 这些 input 类型是「点」的不是「打字」的：焦点落在滑块/复选框上时按 `?`
 * 仍然应该打开面板，否则用户会以为快捷键坏了。
 */
const NON_TEXT_INPUT_TYPES = new Set([
  "range",
  "checkbox",
  "radio",
  "button",
  "submit",
  "reset",
  "file",
  "color",
  "image",
]);

/**
 * 事件目标是不是「正在输入文字」的地方。
 * 用鸭子类型而不是 `instanceof HTMLInputElement`：这个函数要能在 node 里直接测。
 */
export function isTypingTarget(target: unknown): boolean {
  if (!target || typeof target !== "object") return false;
  const el = target as { tagName?: unknown; type?: unknown; isContentEditable?: unknown };
  if (el.isContentEditable === true) return true;
  const tag = typeof el.tagName === "string" ? el.tagName.toLowerCase() : "";
  if (tag === "textarea" || tag === "select") return true;
  if (tag !== "input") return false;
  const type = typeof el.type === "string" ? el.type.toLowerCase() : "text";
  return !NON_TEXT_INPUT_TYPES.has(type);
}

/**
 * 显示用的按键文本。mac 用符号且不加分隔（⌘K），其它平台写全（Ctrl + K）。
 * `?` 这种符号键本身就要按 Shift 才打得出来，不再重复标 Shift。
 */
export function keyLabel(combo: Combo, mac = false): string {
  const parts: string[] = [];
  if (combo.ctrl) parts.push(mac ? "⌘" : "Ctrl");
  if (combo.alt) parts.push(mac ? "⌥" : "Alt");
  if (combo.shift && /^[a-z0-9]$/i.test(combo.key)) parts.push(mac ? "⇧" : "Shift");
  const key =
    combo.key === "escape"
      ? "Esc"
      : combo.key === " "
        ? "Space"
        : combo.key.length === 1
          ? combo.key.toUpperCase()
          : combo.key;
  parts.push(key);
  return parts.join(mac ? "" : " + ");
}

/**
 * 从一批绑定里挑出该处理这个事件的那一条：**按顺序，第一个命中且允许的胜出**。
 *
 * 单独抽成纯函数，是因为最容易出错的正是这几条规则（打字时不抢键、输入法组字时不抢键、
 * 修饰键严格匹配），而它们在原来的写法里散落在各个组件的 keydown 回调中，只能靠手点验证。
 * 现在可以直接断言 —— 见 HANDOFF 待办 2。
 *
 * 调用方负责先把「当前真正可用」的绑定筛出来（没有处理函数的不要传进来）。
 */
export function resolveShortcut(
  e: ShortcutEvent,
  defs: ShortcutDef[],
  opts: { typing: boolean; composing?: boolean },
): ShortcutDef | null {
  // 输入法正在组字：这会儿的 keydown 是拼音过程，抢了就吃键
  if (opts.composing) return null;
  for (const def of defs) {
    if (!comboMatches(e, def.combo)) continue;
    if (opts.typing && !def.allowInTyping) continue;
    return def;
  }
  return null;
}

/** `?` 面板本身。provider 内置处理它，不需要任何组件注册。 */
export const HELP: ShortcutDef = {
  id: "help.toggle",
  combo: { key: "?", shift: true },
  label: "打开 / 关闭这个快捷键面板",
  group: "全局",
};

/** 快速跳转（command-palette.tsx 注册处理函数） */
export const PALETTE_TOGGLE: ShortcutDef = {
  id: "palette.toggle",
  // 原来这个键在输入框里也能用（监听直接挂在 window 上），这里保持原行为
  combo: { key: "k", ctrl: true },
  label: "打开 / 关闭快速跳转",
  group: "全局",
  allowInTyping: true,
};

/**
 * 内置绑定：provider 会遍历它做派发。
 * 导航跳转（Alt+数字）不在这里 —— 它的标签和路由来自 navbar，属于运行时注册。
 */
export const SHORTCUTS: ShortcutDef[] = [HELP, PALETTE_TOGGLE];

/**
 * 由各弹层 / 编辑器**自己实现**的按键：只写进面板说明，不参与派发。
 * 派发它们会和局部实现打架（比如 Esc 要关的是「当前打开的那一层」，
 * 只有那一层自己知道该关谁）。
 */
export const CONTEXTUAL_KEYS: ShortcutDef[] = [
  {
    id: "overlay.close",
    combo: { key: "escape" },
    label: "关闭当前弹层（面板 / 快速跳转 / 导航抽屉 / 弹窗）",
    group: "弹层",
  },
  {
    id: "editor.undo",
    combo: { key: "z", ctrl: true },
    label: "简历工坊：撤回（光标在简历纸里时让给浏览器自带的逐字撤回）",
    group: "简历工坊",
  },
  {
    id: "editor.redo",
    combo: { key: "y", ctrl: true },
    label: "简历工坊：重做（Ctrl+Shift+Z 同效）",
    group: "简历工坊",
  },
];
