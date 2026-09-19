import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
    description: "上传文档即可向 AI 提问，回答可溯源；20+ AI 功能一站式体验。",
  },
};

// 默认背景图：所有未自定义背景的用户默认看到这张图
const DEFAULT_BG_IMAGE = "/api/uploads/55963743-1084-43e5-b5f9-8960e2c3e1ca.jpg";

// 在页面渲染前应用主题（深色模式 + 主题色 + 背景图），避免闪烁
const themeInit = `(function(){
  try{
    var t=localStorage.getItem('theme');
    // 默认深色：知行的设计语言是深色玻璃场景，未设置过的用户直接看到完整效果
    var d=t?t==='dark':true;
    if(d)document.documentElement.classList.add('dark');
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
    else{document.documentElement.style.setProperty('--bg-image','url(${DEFAULT_BG_IMAGE})');}
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
