"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/auth";
import { TourButton } from "@/components/onboarding-tour";
import { Button } from "@/components/ui";

/**
 * 头部导航：一个按钮 + 点开的右侧抽屉，全尺寸统一用这一套，不再铺一排内联链接。
 * 抽屉必须 portal 到 document.body：`.nav-bar` 带 backdrop-filter，按 CSS 规范它就成了
 * position: fixed 后代的包含块 —— 留在头部里的话 fixed inset-0 会相对那 57px 高的头部定位，
 * 抽屉被压成一条并裁掉（在普通 div 里试不出来，祖先没有玻璃）。
 */

export type NavItem = {
  href: string;
  label: string;
  /** 一行说明，帮新用户判断"这是干什么的" */
  hint?: string;
  /** 管理后台这类需要强调的入口 */
  highlight?: boolean;
};

export type NavGroup = { title: string; items: NavItem[] };

export type NavMenuUser = { name?: string | null; email?: string | null } | null;

function HamburgerIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function NavMenu({ groups, user }: { groups: NavGroup[]; user: NavMenuUser }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- 服务端没有 document，portal 只能在
       挂载后启用；首帧必须与 SSR 一致，所以这个标记只能由 effect 回填。 */
    setMounted(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // ESC 关闭 + 打开时锁住页面滚动（抽屉是覆盖层，背景跟着滚会很乱）
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  // 路由一变就收起：点了链接直接走，不用等组件卸载
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- 路由变化是外部系统的事件，
       收起抽屉正是"订阅外部变化后回填状态"。 */
    setOpen(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [pathname]);

  const current = groups.flatMap((g) => g.items).find(
    (l) => pathname === l.href || pathname.startsWith(`${l.href}/`),
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={current ? `打开菜单（当前：${current.label}）` : "打开菜单"}
        className="nav-trigger"
      >
        <HamburgerIcon />
        <span>菜单</span>
      </button>

      {mounted && open
        ? createPortal(
            <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="导航菜单">
              {/* 遮罩：点它关闭。用 button 而不是 div，键盘也能聚焦触发 */}
              <button
                type="button"
                className="nav-scrim absolute inset-0 cursor-default bg-black/55"
                onClick={() => setOpen(false)}
                aria-label="关闭菜单"
              />

              <div className="nav-drawer absolute inset-y-0 right-0 flex w-[min(348px,88vw)] flex-col border-l border-border bg-surface2/95 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-semibold text-fg">
                      {current?.label ?? "导航"}
                    </p>
                    <p className="truncate text-[11.5px] text-muted-fg">
                      {user?.name ? `${user.name} 的导航` : "全部功能"}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setOpen(false)} aria-label="关闭菜单">
                    ✕
                  </Button>
                </div>

                <nav className="flex-1 overflow-y-auto p-2.5" aria-label="主导航">
                  {groups.map((g) => (
                    <div key={g.title} className="mb-1.5 last:mb-0">
                      <p className="px-3 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-fg">
                        {g.title}
                      </p>
                      {g.items.map((l) => {
                        const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
                        return (
                          <Link
                            key={l.href}
                            href={l.href}
                            aria-current={active ? "page" : undefined}
                            className={`block rounded-lg px-3 py-2 transition ${
                              active
                                ? "bg-primary/16 text-primary"
                                : l.highlight
                                  ? "text-primary hover:bg-primary/10"
                                  : "text-fg hover:bg-primary/10"
                            }`}
                          >
                            <span className="block text-[13.5px] font-semibold">{l.label}</span>
                            {l.hint ? (
                              <span className="mt-0.5 block text-[11.5px] leading-relaxed text-muted-fg">
                                {l.hint}
                              </span>
                            ) : null}
                          </Link>
                        );
                      })}
                    </div>
                  ))}
                </nav>

                <div className="flex flex-col gap-2 border-t border-border p-3">
                  <div className="px-1">
                    <p className="truncate text-[13px] font-semibold text-fg">{user?.name ?? "未登录"}</p>
                    <p className="truncate text-[11.5px] text-muted-fg">{user?.email ?? ""}</p>
                  </div>
                  <TourButton tour="main" label="看一遍新手引导" variant="ghost" className="w-full" />
                  <form action={logout}>
                    <Button type="submit" variant="outline" size="sm" className="w-full">
                      退出登录
                    </Button>
                  </form>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
