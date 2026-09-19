import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { RevealObserver } from "@/components/ui/reveal-observer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "知行 · AI 智能知识库",
  description:
    "知行合一 · 基于 RAG 的 AI 智能知识库与求职助手：上传文档即可向 AI 提问，支持多角色 Agent、知识图谱、简历工坊、职位匹配等 20+ 项 AI 功能。",
  keywords: [
    "AI 知识库",
    "RAG",
    "检索增强生成",
    "智能问答",
    "AI Agent",
    "简历制作",
    "求职助手",
    "知识图谱",
    "Next.js",
    "pgvector",
  ],
  authors: [{ name: "知行" }],
  openGraph: {
    title: "知行 · AI 智能知识库",
    description:
      "上传文档即可向 AI 提问，回答可溯源；更有多角色 Agent、知识图谱、简历工坊、职位匹配等丰富 AI 功能。",
    siteName: "知行",
    type: "website",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary_large_image",
    title: "知行 · AI 智能知识库",
    description: "上传文档即可向 AI 提问，回答可溯源。",
  },
};

// 默认背景图：原来指向 /api/uploads/55963743-….jpg，但该文件在仓库里并不存在，
// 实测返回 404 —— body::after 的 background-image 解析为空，页面背后什么都没有。
// 现在默认不设壁纸，页面氛围交给 <ScenicBackdrop> 那份内联 SVG 场景；
// 用户自己上传壁纸后仍会覆盖到 --bg-image，个性化功能不受影响。

// 在页面渲染前应用主题（深色模式 + 主题色 + 背景图），避免闪烁
const themeInit = `(function(){
  try{
    // 知行的设计语言是深色场景（对齐 Summer Checkin），不提供浅色模式
    var d = true;
    document.documentElement.classList.add('dark');
    // 场景换肤：rain 雨林（默认）/ snow 雪境 / cloud 暖云
    var s = localStorage.getItem('scene');
    document.documentElement.setAttribute('data-scene', s || 'rain');
    // 每个场景各自的背景图（在 /settings → 场景背景 里选或上传）
    var scs = ['rain','snow','cloud'];
    for (var i = 0; i < scs.length; i++) {
      var g = localStorage.getItem('scenicBg_' + scs[i]);
      if (g) {
        // 存的是裸路径（或 "none" 表示用内置矢量场景）
        document.documentElement.style.setProperty('--scenic-bg-' + scs[i], g === 'none' ? 'none' : 'url(' + g + ')');
      }
      var gp = localStorage.getItem('scenicBgPos_' + scs[i]);
      if (gp) { document.documentElement.style.setProperty('--scenic-bg-pos-' + scs[i], gp); }
    }
    // 背景总开关
    document.documentElement.setAttribute('data-scenic', localStorage.getItem('scenicOff') === '1' ? 'off' : 'on');
    var a=localStorage.getItem('accent');
    if(a){var c=JSON.parse(a);var r=document.documentElement.style;
      if(c.accent)r.setProperty('--accent',c.accent);
      if(c.hover)r.setProperty('--accent-hover',c.hover);
      if(c.soft)r.setProperty('--accent-soft',c.soft);
      if(c.softer)r.setProperty('--accent-softer',c.softer);
      if(c.border)r.setProperty('--accent-border',c.border);
      if(c.deep)r.setProperty('--accent-deep',c.deep);
    }
    var b=localStorage.getItem('bgImage');
    if(b){document.documentElement.style.setProperty('--bg-image','url('+b+')');}
    var o=localStorage.getItem('bgOpacity');
    if(o)document.documentElement.style.setProperty('--bg-opacity',o);
    var bl=localStorage.getItem('bgBlur');
    if(bl)document.documentElement.style.setProperty('--bg-blur',bl+'px');
  }catch(e){}
})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      data-scene="rain"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* 首帧前给 <html> 打上 .js —— 滚动滑入的隐藏态挂在 .js 上（见 globals.css）。
            刻意做成**独立内联脚本**、不依赖任何 chunk：万一客户端 JS 挂了（资源 403 / 断网 /
            报错），.js 就不存在，隐藏态不生效，内容照常可见，绝不会因为动画而"整页空白"。 */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "document.documentElement.classList.add('js');" +
              "window.__uiRevealReady=false;" +
              // 兜底：1.5s 内观察器没报到，就认为前端 JS 没真正跑起来（chunk 挂了/报错），
              // 立刻撤掉 .js，所有内容恢复可见 —— 宁可没有动画，也绝不能让内容消失。
              "setTimeout(function(){if(!window.__uiRevealReady){document.documentElement.classList.remove('js')}},1500);",
          }}
        />
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="flex min-h-full flex-col">
        {/* 全局滚动滑入观察器：之后任何元素加 ui-reveal 就会滑入，无需包客户端组件 */}
        <RevealObserver />
        {children}
      </body>
    </html>
  );
}
