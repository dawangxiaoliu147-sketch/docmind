import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "登录 · DocMind",
};

const FEATURES = [
  { icon: "✨", text: "拖拽上传，自动解析分块" },
  { icon: "🧠", text: "多角色 Agent 智能问答" },
  { icon: "🗺️", text: "知识图谱 & 学习卡片" },
];

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* 背景装饰光斑 */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-violet-500/25 blur-3xl" />

      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-3xl border border-zinc-200/60 bg-white/75 shadow-2xl backdrop-blur-xl transition hover:shadow-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-900/75 lg:grid-cols-2">
        {/* 左侧品牌区（桌面端） */}
        <div className="hidden flex-col justify-between bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 p-10 text-white lg:flex">
          <div className="flex items-center gap-2 text-xl font-bold">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-lg backdrop-blur">
              D
            </span>
            DocMind
          </div>

          <div>
            <h1 className="text-3xl font-bold leading-tight">
              让 AI 读懂
              <br />
              你的知识库
            </h1>
            <p className="mt-3 text-sm text-indigo-100">
              上传文档，即刻拥有专属的 AI 问答助手
            </p>
            <ul className="mt-6 space-y-2.5">
              {FEATURES.map((f) => (
                <li key={f.text} className="flex items-center gap-2 text-sm text-indigo-100">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/15">
                    {f.icon}
                  </span>
                  {f.text}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-indigo-200">
            © {new Date().getFullYear()} DocMind · AI 智能知识库
          </p>
        </div>

        {/* 右侧表单 */}
        <div className="p-8 sm:p-10">
          <div className="mb-8 lg:hidden">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xl font-bold text-white">
              D
            </div>
            <h1 className="text-2xl font-semibold dark:text-zinc-50">登录 DocMind</h1>
          </div>

          <h2 className="text-xl font-semibold dark:text-zinc-50">欢迎回来 👋</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            继续使用你的 AI 知识库
          </p>

          <div className="mt-6">
            <LoginForm />
          </div>

          <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            还没有账号？{" "}
            <Link
              href="/register"
              className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
