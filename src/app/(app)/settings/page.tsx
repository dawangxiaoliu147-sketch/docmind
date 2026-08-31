import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { Avatar } from "@/components/avatar";
import { AvatarUpload } from "@/components/avatar-upload";
import { AccentPicker } from "@/components/accent-picker";
import { BackgroundPicker } from "@/components/background-picker";

export const metadata: Metadata = {
  title: "设置 · DocMind",
};

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold dark:text-zinc-50">设置</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          管理你的个人资料与界面个性化
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold dark:text-zinc-100">个人资料</h2>
        <div className="mt-4 flex items-center gap-5">
          <Avatar
            name={user.name}
            src={user.avatarUrl}
            className="h-16 w-16 text-2xl"
          />
          <div>
            <p className="font-medium dark:text-zinc-100">{user.name}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{user.email}</p>
            <div className="mt-3">
              <AvatarUpload />
            </div>
          </div>
        </div>
        <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-500">
          支持 JPG / PNG / WebP / GIF，不超过 5MB
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold dark:text-zinc-100">界面个性化</h2>

        <p className="mt-3 mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          主题色
        </p>
        <AccentPicker />

        <div className="mt-6 border-t border-zinc-100 pt-5 dark:border-zinc-800">
          <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            背景图片
          </p>
          <p className="mb-3 text-xs text-zinc-400 dark:text-zinc-500">
            上传一张喜欢的图片作为全站壁纸（淡显，不影响阅读）
          </p>
          <BackgroundPicker />
        </div>

        <p className="mt-5 text-xs text-zinc-400 dark:text-zinc-500">
          深色/浅色模式可在右上角 ☀️/🌙 图标切换
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold dark:text-zinc-100">账户信息</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-500 dark:text-zinc-400">昵称</dt>
            <dd className="font-medium dark:text-zinc-100">{user.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500 dark:text-zinc-400">邮箱</dt>
            <dd className="font-medium dark:text-zinc-100">{user.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500 dark:text-zinc-400">账号 ID</dt>
            <dd className="font-mono text-xs text-zinc-400 dark:text-zinc-500">
              {user.id}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
