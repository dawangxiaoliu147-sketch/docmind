"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Modal } from "@/components/ui";
import {
  CONTEXTUAL_KEYS,
  HELP,
  SHORTCUTS,
  comboMatches,
  isTypingTarget,
  keyLabel,
  resolveShortcut,
  type ShortcutDef,
} from "@/lib/shortcuts";

type Handler = (e: KeyboardEvent) => void;

/**
 * 注册进 provider 的一条绑定。
 * `def` 用 getter 取而不是存快照：调用方每次渲染可能造新对象，
 * 存快照会逼着 effect 依赖 def → 每渲染一次就重注册一次。
 */
type Entry = { def: () => ShortcutDef; handler: Handler };

type ShortcutApi = {
  register: (id: string, entry: Entry) => () => void;
  toggleHelp: () => void;
};

const Ctx = createContext<ShortcutApi | null>(null);

/**
 * 全局快捷键中枢：**只有一个** window keydown 监听，负责
 *   1) 按 lib 里的定义匹配组合键；
 *   2) 统一处理「正在输入框里打字就别抢键」和「输入法组字中别抢键」；
 *   3) 内置 `?` 面板。
 *
 * 挂在 `(app)/layout.tsx`（应用内所有页面）。公开的 `/ui` 活样本页也挂一份，
 * 这样没有账号时也能验证 —— 见 HANDOFF 坑 23。
 */
export function ShortcutProvider({ children }: { children: ReactNode }) {
  const entries = useRef(new Map<string, Entry>());
  const [open, setOpen] = useState(false);
  // 运行时注册的绑定（Alt+数字跳转这类）：既要参与派发，也要显示在面板里，
  // 所以除了 ref 还要一份 state —— ref 变化不会触发重渲染。
  const [runtime, setRuntime] = useState<ShortcutDef[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- portal 只能在挂载后启用；
       首帧必须与 SSR 一致，这个标记只能由 effect 回填（同 nav-menu.tsx 的写法）。 */
    setMounted(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const register = useCallback((id: string, entry: Entry) => {
    entries.current.set(id, entry);
    const def = entry.def();
    setRuntime((prev) => [...prev.filter((d) => d.id !== id), def]);
    return () => {
      // 只在「注册的还是我」时才摘掉：否则会把后来者的注册误删（热更新/快速切换时会发生）
      if (entries.current.get(id) === entry) entries.current.delete(id);
      setRuntime((prev) => prev.filter((d) => d.id !== id));
    };
  }, []);

  const toggleHelp = useCallback(() => setOpen((v) => !v), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // 只把「当前真正有处理函数」的绑定交给派发：静态定义里的 Ctrl+K 在没挂
      // 快速跳转的页面上不该被吃掉（比如公开的 /ui）。
      const registered = [...entries.current.values()].map((en) => en.def());
      const available = [...SHORTCUTS, ...registered].filter(
        (def) => def.id === HELP.id || entries.current.has(def.id),
      );
      const hit = resolveShortcut(e, available, {
        typing: isTypingTarget(e.target),
        // keyCode 229 是老浏览器/部分输入法在组字时给的哨兵值
        composing: e.isComposing || e.keyCode === 229,
      });
      if (!hit) return;
      e.preventDefault();
      if (hit.id === HELP.id) {
        setOpen((v) => !v);
        return;
      }
      entries.current.get(hit.id)?.handler(e);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const api = useMemo<ShortcutApi>(() => ({ register, toggleHelp }), [register, toggleHelp]);

  return (
    <Ctx.Provider value={api}>
      {children}
      {mounted && open
        ? createPortal(
            <ShortcutHelp runtime={runtime} onClose={() => setOpen(false)} />,
            document.body,
          )
        : null}
    </Ctx.Provider>
  );
}

/**
 * 绑定一条快捷键。组件卸载后自动失效。
 *
 * 没有 Provider 时退化成「自己挂一个监听」：这样即便某个页面忘了包 provider，
 * 快捷键也不会静默失效 —— 宁可多一个监听，也不要一个按了没反应的键。
 */
export function useShortcut(def: ShortcutDef, handler: Handler, enabled = true) {
  const ctx = useContext(Ctx);
  const defRef = useRef(def);
  const handlerRef = useRef(handler);

  // 每次渲染把最新的 def/handler 推进 ref，这样注册只需要做一次
  useEffect(() => {
    defRef.current = def;
    handlerRef.current = handler;
  });

  useEffect(() => {
    const initial = defRef.current;
    if (!enabled || !initial) return;
    const entry: Entry = {
      def: () => defRef.current ?? initial,
      handler: (e) => handlerRef.current(e),
    };
    if (ctx) return ctx.register(initial.id, entry);

    // 兜底路径：没有 provider 时自己匹配。守卫规则与 provider 保持一致。
    const onKey = (e: KeyboardEvent) => {
      const d = defRef.current ?? initial;
      if (e.isComposing || e.keyCode === 229) return;
      if (!comboMatches(e, d.combo)) return;
      if (isTypingTarget(e.target) && !d.allowInTyping) return;
      e.preventDefault();
      handlerRef.current(e);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ctx, enabled]);
}

/** mac 上显示 ⌘ / ⌥ 而不是 Ctrl / Alt。服务端只能给 false，挂载后再纠正。 */
function useIsMac(): boolean {
  const [mac, setMac] = useState(false);
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- navigator 只有客户端有；
       首帧按非 mac 渲染才能和 SSR 对齐，否则 hydration 不一致。 */
    setMac(/mac/i.test(navigator.userAgent));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);
  return mac;
}

/**
 * `?` 面板：内容全部由 lib 的绑定 + 运行时注册的绑定生成，不手写。
 * 用 portal 挂到 document.body —— `.ui-overlay` 是 position: fixed，
 * 而任何 backdrop-filter 不为 none 的祖先都会成为它的包含块（HANDOFF 坑 2）。
 */
function ShortcutHelp({ runtime, onClose }: { runtime: ShortcutDef[]; onClose: () => void }) {
  const mac = useIsMac();

  // 面板只列**当前真正可用**的键：静态定义里没被任何组件注册的（比如这一页没有导航栏，
  // 就没有 Ctrl+K）不显示 —— 写着却按不出来，比不写更糟。
  const registeredIds = new Set(runtime.map((d) => d.id));
  const seen = new Set<string>();
  const panelDefs: ShortcutDef[] = [];
  for (const def of [...SHORTCUTS, ...runtime, ...CONTEXTUAL_KEYS]) {
    if (def.id !== HELP.id && !registeredIds.has(def.id) && !CONTEXTUAL_KEYS.includes(def)) continue;
    if (seen.has(def.id)) continue;
    seen.add(def.id);
    panelDefs.push(def);
  }

  // 分组按出现顺序排列，不另外维护一份分组表
  const groups: { title: string; items: ShortcutDef[] }[] = [];
  for (const def of panelDefs) {
    const hit = groups.find((g) => g.title === def.group);
    if (hit) hit.items.push(def);
    else groups.push({ title: def.group, items: [def] });
  }

  return (
    <Modal open onClose={onClose} title="快捷键" description="按 ? 随时打开或关闭">
      <div className="flex flex-col gap-4">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="mb-1.5 text-[12px] font-semibold text-muted-fg">{g.title}</p>
            <div className="flex flex-col">
              {g.items.map((def) => (
                <div key={def.id} className="ui-row">
                  <span className="min-w-0 flex-1 text-[13px] text-fg2">{def.label}</span>
                  <kbd className="mono shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10.5px] font-medium text-muted-fg">
                    {keyLabel(def.combo, mac)}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
        <p className="border-t border-border pt-3 text-[12px] leading-relaxed text-muted-fg">
          标「弹层」和「简历工坊」的按键由对应的界面自己实现，不是全局监听 ——
          面板只负责说明，避免同一个键在两边打架。
        </p>
      </div>
    </Modal>
  );
}
