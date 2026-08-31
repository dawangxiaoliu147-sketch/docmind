import Link from "next/link";
import { getCurrentUser, isAdmin } from "@/lib/dal";
import { logout } from "@/lib/actions/auth";
import { Avatar } from "@/components/avatar";
import { ThemeToggle } from "@/components/theme-toggle";

export async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-base font-semibold"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
              D
            </span>
            DocMind
          </Link>
          <div className="hidden items-center gap-4 text-sm font-medium text-zinc-600 sm:flex dark:text-zinc-300">
            <Link href="/" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
              首页
            </Link>
            <Link href="/dashboard" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
              控制台
            </Link>
            <Link href="/workbench" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
              工作台
            </Link>
            <Link href="/jobs" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
              职位
            </Link>
            <Link href="/settings" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
              设置
            </Link>
            <Link href="/achievements" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
              成就
            </Link>
            {isAdmin(user) && (
              <Link
                href="/admin"
                className="font-semibold text-indigo-600 transition hover:text-indigo-700 dark:text-indigo-400"
              >
                管理后台
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/settings"
            className="flex items-center gap-2 transition hover:opacity-80"
          >
            <Avatar
              name={user?.name ?? "?"}
              src={user?.avatarUrl}
              className="h-8 w-8 text-sm"
            />
            <span className="hidden text-sm text-zinc-600 sm:inline dark:text-zinc-300">
              {user?.name}
            </span>
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              退出
            </button>
          </form>
        </div>
      </nav>
    </header>
  );
}
