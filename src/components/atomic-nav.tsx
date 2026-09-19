"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * 居中的「原子导航」：纯 CSS，不用 JS 管开合 —— 收起时只露图标，`:hover` / `:focus-within`
 * 把每项的文字从 `max-width: 0` 过渡出来，药丸跟着变宽。
 * 用 `max-width` 过渡而不是写死容器宽度：加减一个导航项不用回来改两个数字，宽度由内容自己决定。
 * `:focus-within` 与 `:hover` 并列是给键盘用户的，否则 Tab 进来看不到文字。
 */

export type AtomicNavItem = {
  href: string;
  label: string;
  /** 单色字符图标，和项目里其它图标同一套语言 */
  icon: string;
};

export function AtomicNav({ items }: { items: AtomicNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="atomic-nav" aria-label="主导航">
      {items.map((it) => {
        const active = pathname === it.href || pathname.startsWith(`${it.href}/`);
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className="atomic-nav__item"
            title={it.label}
          >
            <span className="atomic-nav__icon" aria-hidden="true">
              {it.icon}
            </span>
            <span className="atomic-nav__label">{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
