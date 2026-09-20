"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useShortcut } from "@/components/shortcuts";
import { PALETTE_TOGGLE } from "@/lib/shortcuts";

const LINKS = [
  { href: "/dashboard", label: "控制台", icon: "◈" },
  { href: "/workbench", label: "工作台", icon: "⊞" },
  { href: "/jobs", label: "职位库", icon: "⬢" },
  { href: "/settings", label: "设置", icon: "⊙" },
  { href: "/achievements", label: "成就", icon: "◆" },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Ctrl+K 改由快捷键中枢统一派发：键位和说明都定义在 lib/shortcuts.ts，
  // `?` 面板会自动把它列出来，不会再出现「说明和实现各写一份」的漂移。
  useShortcut(PALETTE_TOGGLE, () => setOpen((v) => !v));

  // Esc 仍然归弹层自己管：要关的是「当前打开的这一层」，中枢不该替它决定关谁
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const filtered = LINKS.filter((l) => l.label.includes(query));

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn btn-outline btn-sm hidden sm:flex"
        aria-label="快速跳转"
      >
        <span>搜索</span>
        <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-fg">
          Ctrl K
        </kbd>
      </button>

      {open && (
        <div
          className="ui-overlay items-start pt-24"
          onClick={() => setOpen(false)}
        >
          <div
            className="glass-strong w-full max-w-md p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && filtered[0]) go(filtered[0].href);
              }}
              placeholder="输入关键字快速跳转…"
              className="ui-field"
            />
            <div className="mt-2">
              {filtered.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted-fg">没有匹配的页面</p>
              ) : (
                filtered.map((l) => (
                  <button
                    key={l.href}
                    onClick={() => go(l.href)}
                    className="ui-row w-full text-left text-fg2 hover:text-fg"
                  >
                    <span>{l.icon}</span>
                    {l.label}
                  </button>
                ))
              )}
            </div>
            <p className="mt-2 border-t border-border px-3 pt-2 text-xs text-muted-fg">
              Ctrl+K 开关 · Esc 关闭 · 回车跳转
            </p>
          </div>
        </div>
      )}
    </>
  );
}
