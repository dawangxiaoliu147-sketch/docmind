import Link from "next/link";
import { SceneSwitcher } from "@/components/scene-switcher";
import { Logo } from "@/components/logo";

// 落地页/关于页共用的顶部导航
export function LandingNav() {
  return (
    <header className="nav-bar">
      <nav className="nav-inner">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-fg">
          <Logo className="h-8 w-8" />
          知行
        </Link>

        <div className="hidden items-center gap-1 sm:flex">
          <Link href="/#features" className="nav-link">
            功能
          </Link>
          <Link href="/#how" className="nav-link">
            如何使用
          </Link>
          <Link href="/about" className="nav-link">
            关于
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <SceneSwitcher />
          <Link href="/login" className="btn btn-ghost btn-sm">
            登录
          </Link>
          <Link href="/dashboard" className="btn btn-primary btn-sm">
            进入控制台
          </Link>
        </div>
      </nav>
    </header>
  );
}
