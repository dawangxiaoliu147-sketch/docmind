import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

// 落地页/关于页共用的顶部导航
export function LandingNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/80 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/80">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-base font-bold text-white">
            D
          </span>
          DocMind
        </Link>

        <div className="hidden items-center gap-6 text-sm font-medium text-zinc-600 sm:flex dark:text-zinc-300">
          <Link href="/#features" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
            功能
          </Link>
          <Link href="/#how" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
            如何使用
          </Link>
          <Link href="/about" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
            关于
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            登录
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            进入控制台
          </Link>
        </div>
      </nav>
    </header>
  );
}
