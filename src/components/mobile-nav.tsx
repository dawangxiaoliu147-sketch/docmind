"use client";

import { useState } from "react";
import Link from "next/link";

export type NavLink = {
  href: string;
  label: string;
  highlight?: boolean;
};

export function MobileNav({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="打开菜单"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-lg text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
      >
        {open ? "✕" : "☰"}
      </button>

      {open && (
        <div className="fixed inset-x-0 top-14 z-20 border-b border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto max-w-6xl">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${
                  l.highlight
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
