"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "总览" },
  { href: "/admin/requests", label: "访问申请" },
  { href: "/admin/users", label: "用户" },
  { href: "/admin/knowledge-bases", label: "知识库" },
  { href: "/admin/documents", label: "文档" },
  { href: "/admin/conversations", label: "对话" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {LINKS.map((l) => {
        const active =
          pathname === l.href ||
          (l.href !== "/admin" && pathname.startsWith(l.href));
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className="nav-item"
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
