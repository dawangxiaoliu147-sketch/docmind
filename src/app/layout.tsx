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
  title: "DocMind · AI 智能知识库",
  description: "基于 RAG 检索增强生成的 AI 智能知识库助手",
};

// 在页面渲染前应用主题（深色模式 + 主题色 + 背景图），避免闪烁
const themeInit = `(function(){
  try{
    var t=localStorage.getItem('theme');
    var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);
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
    if(b)document.documentElement.style.setProperty('--bg-image','url('+b+')');
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
