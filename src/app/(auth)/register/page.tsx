import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "注册 · 文档生活助手",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-xl font-bold text-white">
            D
          </div>
          <h1 className="text-2xl font-semibold dark:text-zinc-50">创建账号</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            开始构建你的 AI 知识库
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <RegisterForm />
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          已有账号？{" "}
          <Link
            href="/login"
            className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            去登录
          </Link>
        </p>
      </div>
    </div>
  );
}
