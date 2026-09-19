import { Navbar } from "@/components/navbar";
import { FloatingAgent } from "@/components/floating-agent";
import { OnboardingTour } from "@/components/onboarding-tour";
import { ScenicBackdrop } from "@/components/ui";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-bg app-shell has-scenic ui-scene-fade min-h-screen">
      {/* 应用内页用"淡版"场景背板：场景只留隐约氛围，
          玻璃面板终于有东西可以 backdrop-blur —— 「光影层次」就是这么来的 */}
      <ScenicBackdrop veil="strong" />
      <Navbar />
      {/*
        容器宽度与内边距**必须和头部 .nav-inner 一致**（1200px + clamp(1rem,3vw,1.5rem)）。
        之前这里是 max-w-6xl（1152px）+ px-4，而头部是 1200px + clamp(...) ——
        两套宽度差 48px、内边距也差，于是导航里的品牌/头像和页面内容的左右边缘永远对不齐，
        滚动时能明显看出错位。
      */}
      <main className="mx-auto w-full max-w-[1200px] px-[clamp(1rem,3vw,1.5rem)] py-8">{children}</main>
      <FloatingAgent />
      {/* 新手引导：首次进入自动播放一次，逐步跳转把主要功能走一遍 */}
      <OnboardingTour />
    </div>
  );
}
