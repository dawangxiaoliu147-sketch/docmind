import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { Avatar } from "@/components/avatar";
import { AvatarUpload } from "@/components/avatar-upload";
import { AccentPicker } from "@/components/accent-picker";
import { BackgroundPicker } from "@/components/background-picker";
import { SceneBackdropPicker } from "@/components/scene-backdrop-picker";
import { TourButton, TourHub } from "@/components/onboarding-tour";
import { KV, KVRow, PageHeader, Panel, Section, Stack } from "@/components/ui";

export const metadata: Metadata = {
  title: "设置 · 知行",
};

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <Stack>
      <PageHeader
        eyebrow="settings"
        title="设置"
        subtitle="管理你的个人资料与界面个性化"
        actions={<TourButton tour="settings" />}
      />

      <Panel className="p-6" data-tour="tour-hub">
        <Section title="功能引导" extra="每个功能一条，需要就点">
          <TourHub />
        </Section>
      </Panel>

      <Panel className="p-6">
        <Section title="个人资料">
          <div className="flex items-center gap-5">
            <Avatar
              name={user.name}
              src={user.avatarUrl}
              className="h-16 w-16 text-2xl"
            />
            <div className="min-w-0">
              <p className="font-medium text-fg">{user.name}</p>
              <p className="text-sm text-muted-fg">{user.email}</p>
              <div className="mt-3">
                <AvatarUpload />
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-fg">
            支持 JPG / PNG / WebP / GIF，不超过 5MB
          </p>
        </Section>
      </Panel>

      <Panel className="p-6" data-tour="scenic-picker">
        <Section title="场景背景" extra="每个场景一张，跟着场景切换">
          <SceneBackdropPicker />
        </Section>
      </Panel>

      <Panel className="p-6">
        <Section title="界面个性化">
          <div className="mt-6 border-t border-border pt-5" data-tour="accent-picker">
            <p className="mb-1 text-xs font-medium text-muted-fg">主题色</p>
            <AccentPicker />
          </div>

          <div className="mt-6 border-t border-border pt-5">
            <p className="mb-1 text-xs font-medium text-muted-fg">
              自定义壁纸（可选，与上面的场景背景叠加）
            </p>
            <p className="mb-3 text-xs text-muted-fg">
              上传一张自己的图作为全站淡显纹理（透明度很低，只用于增加质感，不影响阅读）
            </p>
            <BackgroundPicker />
          </div>

          <div className="mt-5 border-t border-border pt-5">
            <p className="max-w-md text-xs text-muted-fg">
              主题场景（雨林 / 雪境 / 暖云）可在右上角的三个色点切换，场景背景与知行岛都会跟着换
            </p>
          </div>
        </Section>
      </Panel>

      <Panel className="p-6">
        <Section title="账户信息">
          <KV>
            <KVRow k="昵称">{user.name}</KVRow>
            <KVRow k="邮箱">{user.email}</KVRow>
            <KVRow k="账号 ID">
              <span className="mono text-xs text-muted-fg">{user.id}</span>
            </KVRow>
          </KV>
        </Section>
      </Panel>
    </Stack>
  );
}
