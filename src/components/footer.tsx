import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 text-base font-bold">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
                D
              </span>
              DocMind
            </div>
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
              基于 RAG 的 AI 智能知识库，让你的文档可被 AI 检索与问答。
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              产品
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
              <li>
                <Link
                  href="/#features"
                  className="transition hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  功能特性
                </Link>
              </li>
              <li>
                <Link
                  href="/#how"
                  className="transition hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  如何使用
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="transition hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  控制台
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              关于
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
              <li>
                <Link
                  href="/about"
                  className="transition hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  项目介绍
                </Link>
              </li>
              <li>
                <span className="cursor-default">
                  Next.js + Prisma + pgvector
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-zinc-100 pt-6 text-center text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
          © {new Date().getFullYear()} DocMind · 全栈 AI 知识库项目 · v1.0
        </div>
      </div>
    </footer>
  );
}
