import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "注册 · 知行",
};

export default function RegisterPage() {
  // 只有服务端配置了 INVITE_CODE 才显示邀请码输入框
  const needInvite = Boolean((process.env.INVITE_CODE ?? "").trim());

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-xl font-bold text-white">
            D
          </div>
          <h1 className="text-2xl font-semibold dark:text-zinc-50">创建账号</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {needInvite
              ? "提交后需管理员审核；填写邀请码可直接开通"
              : "本站为审核制，提交申请后由管理员开通"}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <RegisterForm needInvite={needInvite} />
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
