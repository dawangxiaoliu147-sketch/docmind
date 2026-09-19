import Link from "next/link";
import { getCurrentUser, isAdmin } from "@/lib/dal";
import { logout } from "@/lib/actions/auth";
import { Avatar } from "@/components/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNav, type NavLink } from "@/components/mobile-nav";
import { CommandPalette } from "@/components/command-palette";
import { Logo } from "@/components/logo";

export async function Navbar() {
  const user = await getCurrentUser();

  const links: NavLink[] = [
    { href: "/dashboard", label: "控制台" },
    { href: "/workbench", label: "工作台" },
    { href: "/jobs", label: "职位" },
    { href: "/resume", label: "简历" },
    { href: "/settings", label: "设置" },
    ...(isAdmin(user)
      ? [{ href: "/admin", label: "管理后台", highlight: true }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200/70 bg-white/80 shadow-[0_1px_14px_-10px_rgba(16,24,40,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-[rgba(9,22,17,0.72)]">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-3 sm:gap-6">
          <MobileNav links={links} />
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-base font-semibold"
          >
            <Logo className="h-7 w-7" />
            知行
          </Link>
          <div className="hidden items-center gap-4 text-sm font-medium text-zinc-600 sm:flex dark:text-zinc-300">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={
                  l.highlight
                    ? "font-semibold text-indigo-600 transition hover:text-indigo-700 dark:text-[#d7ef83]"
                    : "transition hover:text-zinc-900 dark:hover:text-zinc-100"
                }
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <CommandPalette />
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
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-white/15 dark:text-zinc-200 dark:hover:bg-white/5"
            >
              退出
            </button>
          </form>
        </div>
      </nav>
    </header>
  );
}
