"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "控制台", icon: "📊" },
  { href: "/workbench", label: "工作台", icon: "🧰" },
  { href: "/jobs", label: "职位库", icon: "💼" },
  { href: "/settings", label: "设置", icon: "⚙️" },
  { href: "/achievements", label: "成就", icon: "🏆" },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
        className="hidden items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-500 transition hover:bg-zinc-100 sm:flex dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        aria-label="快速跳转"
      >
        <span>搜索</span>
        <kbd className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          Ctrl K
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-24"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-2 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
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
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <div className="mt-2">
              {filtered.length === 0 ? (
                <p className="px-3 py-2 text-sm text-zinc-400">没有匹配的页面</p>
              ) : (
                filtered.map((l) => (
                  <button
                    key={l.href}
                    onClick={() => go(l.href)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    <span>{l.icon}</span>
                    {l.label}
                  </button>
                ))
              )}
            </div>
            <p className="mt-2 border-t border-zinc-100 px-3 pt-2 text-xs text-zinc-400 dark:border-zinc-800">
              Ctrl+K 开关 · Esc 关闭 · 回车跳转
            </p>
          </div>
        </div>
      )}
    </>
  );
}
