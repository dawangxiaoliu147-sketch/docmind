import Link from "next/link";
import { getCurrentUser, isAdmin } from "@/lib/dal";
import { Avatar } from "@/components/avatar";
import { SceneSwitcher } from "@/components/scene-switcher";
import { NavMenu, type NavGroup } from "@/components/nav-menu";
import { AtomicNav, type AtomicNavItem } from "@/components/atomic-nav";
import { CommandPalette } from "@/components/command-palette";
import { NavShortcuts } from "@/components/nav-shortcuts";
import { Logo } from "@/components/logo";

export async function Navbar() {
  const user = await getCurrentUser();

  /**
   * 分三组，而不是平铺九条 —— 新用户先找"我要干哪类事"，再看具体入口。
   * 每项配一行说明：光看「工作台」「码头」这种名字猜不出点进去是什么。
   */
  const groups: NavGroup[] = [
    {
      title: "知识",
      items: [
        { href: "/dashboard", label: "控制台", hint: "建知识库、上传文档、向 AI 提问" },
        { href: "/island", label: "我的岛", hint: "你的积累长成的一座岛，点建筑直接进功能" },
        { href: "/workbench", label: "工作台", hint: "13 个现成的 AI 工作助手" },
        { href: "/achievements", label: "成就", hint: "里程碑与解锁进度" },
      ],
    },
    {
      title: "求职",
      items: [
        { href: "/jobs", label: "职位库", hint: "浏览职位、按简历推荐、模拟面试" },
        { href: "/resume", label: "简历工坊", hint: "A4 模板 · 在线编辑 · 智能体改简历" },
        { href: "/agent", label: "智能体", hint: "描述任务，它自己决定调用哪些工具" },
      ],
    },
    {
      title: "系统",
      items: [
        { href: "/settings", label: "设置", hint: "场景背景、主题色、功能引导" },
        ...(isAdmin(user)
          ? [{ href: "/admin", label: "管理后台", hint: "用户与内容管理", highlight: true }]
          : []),
      ],
    },
  ];

  const primary: AtomicNavItem[] = [
    { href: "/dashboard", label: "控制台", icon: "◈" },
    { href: "/island", label: "我的岛", icon: "⬡" },
    { href: "/workbench", label: "工作台", icon: "⊞" },
    { href: "/jobs", label: "职位库", icon: "≋" },
    { href: "/resume", label: "简历工坊", icon: "⊡" },
    { href: "/agent", label: "智能体", icon: "✦" },
  ];

  return (
    <header className="nav-bar">
      <nav className="nav-inner">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2 text-base font-semibold text-fg">
            <Logo className="h-7 w-7" />
            知行
          </Link>
        </div>

        {/* 居中的图标导航：鼠标悬停自动展开文字，不用点 */}
        <AtomicNav items={primary} />
        {/* Alt+1..9 跳到上面这些入口：列表就是这里这份 primary，不在别处再抄一遍 */}
        <NavShortcuts items={primary} />

        <div className="flex shrink-0 items-center gap-2.5">
          <CommandPalette />
          <SceneSwitcher />
          <Link href="/settings" className="flex items-center transition hover:opacity-80" aria-label="个人设置">
            <Avatar
              name={user?.name ?? "?"}
              src={user?.avatarUrl}
              className="h-8 w-8 text-sm"
            />
          </Link>
          {/* 剩下的入口（成就 / 设置 / 管理后台 / 用户信息 / 引导 / 退出）收在这个抽屉里 */}
          <NavMenu groups={groups} user={user ? { name: user.name, email: user.email } : null} />
        </div>
      </nav>
    </header>
  );
}
