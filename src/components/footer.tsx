import Link from "next/link";
import { Logo } from "@/components/logo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg">
      {/* 与头部 .nav-inner / 页面主容器 用同一套宽度和内边距（1200px + clamp(...)），
          否则页脚内容和上面的导航、正文左右边缘对不齐（之前这里是 1152px + px-4） */}
      <div className="mx-auto max-w-[1200px] px-[clamp(1rem,3vw,1.5rem)] py-10">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 text-base font-bold text-fg">
              <Logo className="h-7 w-7" />
              知行
            </div>
            <p className="mt-3 text-sm text-muted-fg">
              基于 RAG 的 AI 智能知识库，让你的文档可被 AI 检索与问答。
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-fg">产品</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-fg">
              <li>
                <Link href="/#features" className="transition hover:text-fg">
                  功能特性
                </Link>
              </li>
              <li>
                <Link href="/#how" className="transition hover:text-fg">
                  如何使用
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="transition hover:text-fg">
                  控制台
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-fg">关于</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-fg">
              <li>
                <Link href="/about" className="transition hover:text-fg">
                  项目介绍
                </Link>
              </li>
              <li>
                <span className="cursor-default">Next.js + Prisma + pgvector</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-fg">
          © {new Date().getFullYear()} 知行 · 全栈 AI 知识库项目 · v1.0
        </div>
      </div>
    </footer>
  );
}
