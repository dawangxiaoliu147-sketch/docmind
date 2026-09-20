"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { AtomicNavItem } from "@/components/atomic-nav";
import { useShortcut } from "@/components/shortcuts";
import type { ShortcutDef } from "@/lib/shortcuts";

/**
 * Alt+1..9 直接跳到主入口。
 *
 * 导航项由 Navbar（服务端组件）传进来，而不是在这里再抄一份列表 ——
 * 两份列表一定会漂移，到时候快捷键跳去的地方和导航栏上显示的就对不上了。
 */
export function NavShortcuts({ items }: { items: AtomicNavItem[] }) {
  return (
    <>
      {items.slice(0, 9).map((item, i) => (
        <NavShortcut key={item.href} item={item} index={i} />
      ))}
    </>
  );
}

/** 每一项拆成一个子组件：Hook 不能写在 map 回调里，拆开才能各注册一条绑定 */
function NavShortcut({ item, index }: { item: AtomicNavItem; index: number }) {
  const router = useRouter();

  const def = useMemo<ShortcutDef>(
    () => ({
      id: `nav.${index + 1}`,
      combo: { key: String(index + 1), alt: true },
      label: `跳到「${item.label}」`,
      group: "跳转",
      // 在输入框里也生效：跳页和打字不冲突，否则得先点一下空白处才能走
      allowInTyping: true,
    }),
    [index, item.label],
  );

  const go = useCallback(() => router.push(item.href), [router, item.href]);
  useShortcut(def, go);

  return null;
}
