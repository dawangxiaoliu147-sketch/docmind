"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "📊 总览" },
  { href: "/admin/users", label: "👤 用户" },
  { href: "/admin/knowledge-bases", label: "🗂️ 知识库" },
  { href: "/admin/documents", label: "📄 文档" },
  { href: "/admin/conversations", label: "💬 对话" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {LINKS.map((l) => {
        const active =
          pathname === l.href ||
          (l.href !== "/admin" && pathname.startsWith(l.href));
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
