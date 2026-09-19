import Link from "next/link";
import type { CSSProperties } from "react";
import { Logo } from "@/components/logo";
import { LandingReveal } from "@/components/landing-reveal";

// 给 reveal 元素挂错峰延迟（CSS 自定义属性）
const d = (s: string) => ({ "--d": s }) as CSSProperties;

const FEATURES = [
  {
    icon: "◈",
    title: "RAG 知识库问答",
    desc: "上传文档自动解析、分块、向量化，AI 严格基于你的资料作答，引用可溯源、不瞎编。",
    tag: "pgvector",
  },
  {
    icon: "✦",
    title: "多角色 Agent",
    desc: "知识库 6 个角色 + 工作台 13 个职场助手，模型自主调用工具、多步推理。",
    tag: "tool calls",
  },
  {
    icon: "≋",
    title: "混合检索",
    desc: "语义向量 + 关键词双路检索再去重合并，专有名词也不会漏，支持跨知识库搜索。",
    tag: "hybrid",
  },
  {
    icon: "⊞",
    title: "简历工坊",
    desc: "8 套模板的所见即所得编辑器，A4 实时排版，支持撤回恢复、导出 PDF／HTML。",
    tag: "8 layouts",
  },
  {
    icon: "⬢",
    title: "求职助手",
    desc: "职位库 + 简历匹配打分 + 岗位推荐 + 模拟面试，一条求职链路走完。",
    tag: "jobs",
  },
  {
    icon: "◐",
    title: "AI 学习玩法",
    desc: "知识闪卡、闯关答题、知识图谱、每日一问，边用边把资料变成自己的。",
    tag: "quiz",
  },
  {
    icon: "⊹",
    title: "知识图谱",
    desc: "AI 自动梳理文档结构，生成层级图谱，一眼看清知识脉络与关联。",
    tag: "graph",
  },
  {
    icon: "⊡",
    title: "桌面宠物智能体",
    desc: "右下角随叫随到的助手，跨模块查数据、改简历、答问题，不用来回切页面。",
    tag: "agent",
  },
  {
    icon: "↯",
    title: "容器化部署",
    desc: "四阶段 Docker 镜像 + Compose 编排，GitHub Actions 自动构建发布，推送即上线。",
    tag: "docker",
  },
];

const METRICS = [
  { v: "13", l: "工作台 AI Agent" },
  { v: "6", l: "知识库角色" },
  { v: "8", l: "简历模板" },
  { v: "100%", l: "回答引用可溯源" },
];

const STEPS = [
  {
    num: "01",
    title: "创建知识库",
    desc: "注册账号，按主题建库，上传封面、挑一个主题色，几十秒搞定。",
  },
  {
    num: "02",
    title: "把资料丢进来",
    desc: "PDF、Word、Markdown、CSV 都行，自动解析、打标签、分块向量化入库。",
  },
  {
    num: "03",
    title: "开始提问",
    desc: "用大白话问，它先检索再作答并标出出处；还能出题、画图谱、顺手改简历。",
  },
];

const TECH_STACK = [
  "Next.js 16",
  "React 19",
  "TypeScript",
  "Prisma 7",
  "PostgreSQL",
  "pgvector",
  "Vercel AI SDK",
  "Docker",
  "Docker Compose",
  "GitHub Actions",
];

export default function LandingPage() {
  return (
    <div className="zx-landing">
      {/* 固定背板：内联 SVG，零外链、零 CORS、零 ORB 拦截风险 */}
      <svg
        className="zx-backdrop"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="zxSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a0e20" />
            <stop offset="45%" stopColor="#0c1230" />
            <stop offset="100%" stopColor="#070912" />
          </linearGradient>
          <radialGradient id="zxGlow" cx="50%" cy="6%" r="62%">
            <stop offset="0%" stopColor="#9aa6ff" stopOpacity="0.22" />
            <stop offset="55%" stopColor="#6b7cff" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#6b7cff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="zxAurora" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6b7cff" stopOpacity="0" />
            <stop offset="35%" stopColor="#8b96ff" stopOpacity="0.16" />
            <stop offset="65%" stopColor="#b48cff" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#6b7cff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="zxFar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1b2550" />
            <stop offset="100%" stopColor="#111834" />
          </linearGradient>
          <linearGradient id="zxMid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#131a3a" />
            <stop offset="100%" stopColor="#0b1026" />
          </linearGradient>
          <linearGradient id="zxNear" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a0d1e" />
            <stop offset="100%" stopColor="#05060f" />
          </linearGradient>
        </defs>

        <rect width="1920" height="1080" fill="url(#zxSky)" />
        <rect width="1920" height="1080" fill="url(#zxGlow)" />

        {/* 极光带 */}
        <ellipse cx="960" cy="340" rx="860" ry="120" fill="url(#zxAurora)" />
        <ellipse cx="680" cy="280" rx="520" ry="66" fill="url(#zxAurora)" opacity="0.65" />

        {/* 星点 */}
        <g fill="#dfe4ff">
          <circle cx="150" cy="120" r="1.6" opacity="0.5" />
          <circle cx="320" cy="70" r="1.2" opacity="0.38" />
          <circle cx="470" cy="190" r="1.8" opacity="0.55" />
          <circle cx="610" cy="96" r="1.1" opacity="0.3" />
          <circle cx="760" cy="160" r="1.5" opacity="0.45" />
          <circle cx="920" cy="88" r="1.3" opacity="0.35" />
          <circle cx="1090" cy="175" r="1.9" opacity="0.5" />
          <circle cx="1240" cy="104" r="1.2" opacity="0.32" />
          <circle cx="1400" cy="200" r="1.6" opacity="0.46" />
          <circle cx="1560" cy="118" r="1.3" opacity="0.36" />
          <circle cx="1710" cy="182" r="1.7" opacity="0.48" />
          <circle cx="1840" cy="92" r="1.2" opacity="0.3" />
          <circle cx="240" cy="270" r="1.4" opacity="0.34" />
          <circle cx="1330" cy="286" r="1.5" opacity="0.38" />
          <circle cx="1790" cy="300" r="1.2" opacity="0.28" />
          <circle cx="520" cy="330" r="1.3" opacity="0.3" />
        </g>

        {/* 远山 / 中景 / 前景 三层山脊 */}
        <path
          d="M0 640 L150 540 L300 600 L470 486 L640 586 L820 512 L1000 610 L1180 505 L1360 596 L1540 520 L1720 606 L1920 540 L1920 1080 L0 1080 Z"
          fill="url(#zxFar)"
          opacity="0.85"
        />
        <path
          d="M0 780 L210 672 L400 756 L610 646 L840 764 L1060 664 L1300 768 L1530 682 L1760 776 L1920 720 L1920 1080 L0 1080 Z"
          fill="url(#zxMid)"
        />
        <path
          d="M0 920 L250 842 L500 918 L790 828 L1090 928 L1380 846 L1680 934 L1920 878 L1920 1080 L0 1080 Z"
          fill="url(#zxNear)"
        />

        {/* 尘埃粒子 */}
        <g fill="#9aa6ff">
          <circle cx="420" cy="470" r="2" opacity="0.22" />
          <circle cx="700" cy="540" r="1.5" opacity="0.18" />
          <circle cx="1010" cy="430" r="1.8" opacity="0.2" />
          <circle cx="1290" cy="520" r="1.4" opacity="0.16" />
          <circle cx="1580" cy="450" r="2" opacity="0.2" />
          <circle cx="300" cy="600" r="1.6" opacity="0.16" />
          <circle cx="1120" cy="640" r="1.5" opacity="0.14" />
          <circle cx="1760" cy="590" r="1.7" opacity="0.18" />
        </g>
      </svg>

      <div className="zx-veil" aria-hidden="true" />
      <div className="zx-grain" aria-hidden="true" />

      <div className="zx-shell">
        {/* ---------- 顶部导航 ---------- */}
        <header className="zx-nav">
          <nav className="zx-nav-inner">
            <Link href="/" className="zx-brand">
              <Logo className="h-7 w-7" />
              知行
            </Link>

            <div className="zx-navlinks">
              <Link href="/#features">功能</Link>
              <Link href="/#how">如何使用</Link>
              <Link href="/about">关于</Link>
            </div>

            <div className="zx-nav-actions">
              <Link href="/login" className="zx-btn zx-btn-sm zx-btn-ghost">
                登录
              </Link>
              <Link href="/dashboard" className="zx-btn zx-btn-sm zx-btn-primary">
                进入控制台
              </Link>
            </div>
          </nav>
        </header>

        <main>
          {/* ---------- 首屏 ---------- */}
          <section className="zx-hero">
            <div>
              <span className="zx-eyebrow zx-reveal">基于 RAG 检索增强生成</span>
              <h1 className="zx-h1 zx-reveal" style={d("0.05s")}>
                让你的文档，
                <br />
                <em>开口回答问题</em>
              </h1>
              <p className="zx-lead zx-reveal" style={d("0.1s")}>
                知行 —— 上传你的资料，AI 自动解析、分块、向量化，让你用自然语言提问，答案标出出处、可一键核对。
                再顺手把知识用到简历、岗位和面试上。
              </p>
              <div className="zx-hero-cta zx-reveal" style={d("0.15s")}>
                <Link href="/register" className="zx-btn zx-btn-primary">
                  免费开始使用
                </Link>
                <Link href="/#how" className="zx-btn zx-btn-outline">
                  了解如何工作
                </Link>
              </div>
            </div>

            {/* 产品预览：玻璃面板 */}
            <div className="zx-panel zx-reveal" style={d("0.18s")}>
              <div className="zx-panel-head">
                <span className="zx-panel-logo">
                  <Logo className="h-4 w-4" />
                </span>
                知识库 · 产品手册
              </div>
              <div className="zx-bubble-user">年假可以结转多少天？</div>
              <div className="zx-bubble-ai">
                根据《员工手册》，年假未用完可结转至次年，最多结转 <strong>5 天</strong>。
                <div className="zx-cite">参考：片段 2 · 员工每年享有 10 天带薪年假…</div>
                <div className="zx-cite">参考：片段 5 · 年假未用完可结转至次年，最多 5 天</div>
              </div>
            </div>
          </section>

          {/* ---------- 指标条 ---------- */}
          <section className="zx-metrics">
            <div className="zx-metrics-inner zx-reveal">
              {METRICS.map((m) => (
                <div key={m.l} className="zx-metric">
                  <b>{m.v}</b>
                  <span>{m.l}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ---------- 核心功能 ---------- */}
          <section id="features" className="zx-section">
            <div className="zx-section-head zx-reveal">
              <span className="zx-eyebrow">核心功能</span>
              <h2 className="zx-h2">从一份文档，到一条完整的知识链路</h2>
              <p className="zx-sub">
                不只是聊天。检索、问答、出题、图谱、简历、岗位 —— 都长在同一个知识库上。
              </p>
            </div>

            <div className="zx-feats">
              {FEATURES.map((f, i) => (
                <article
                  key={f.title}
                  className="zx-feat zx-reveal"
                  style={d(`${(i % 3) * 0.05}s`)}
                >
                  <div className="zx-feat-icon" aria-hidden="true">
                    {f.icon}
                  </div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                  <div className="zx-feat-foot">
                    <span className="zx-badge">{f.tag}</span>
                    <span className="zx-arrow">→</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* ---------- 三步开始 ---------- */}
          <section id="how" className="zx-section">
            <div className="zx-section-head zx-reveal">
              <span className="zx-eyebrow">如何使用</span>
              <h2 className="zx-h2">三步开始，不用训练模型</h2>
              <p className="zx-sub">文档即知识。上传什么，它就能回答什么。</p>
            </div>

            <div className="zx-steps">
              {STEPS.map((s, i) => (
                <div key={s.num} className="zx-step zx-reveal" style={d(`${i * 0.07}s`)}>
                  <span className="zx-step-num">{s.num}</span>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ---------- 技术栈 ---------- */}
          <section className="zx-section">
            <div className="zx-section-head zx-reveal">
              <span className="zx-eyebrow">技术栈</span>
              <h2 className="zx-h2">现代全栈 + 容器化交付</h2>
            </div>
            <div className="zx-chips zx-reveal">
              {TECH_STACK.map((t) => (
                <span key={t} className="zx-chip">
                  {t}
                </span>
              ))}
            </div>
          </section>

          {/* ---------- 结尾 CTA ---------- */}
          <section className="zx-cta">
            <div className="zx-cta-inner zx-reveal">
              <span className="zx-eyebrow">现在开始</span>
              <h2 className="zx-h2">把散落的资料，变成随时能问的知识库</h2>
              <p className="zx-sub" style={{ margin: "12px auto 0", maxWidth: "30rem" }}>
                注册后提交申请，管理员开通即可使用。
              </p>
              <div className="zx-cta-actions">
                <Link href="/register" className="zx-btn zx-btn-primary">
                  免费开始使用
                </Link>
                <Link href="/login" className="zx-btn zx-btn-outline">
                  已有账号，去登录
                </Link>
              </div>
            </div>
          </section>
        </main>

        {/* ---------- 页脚 ---------- */}
        <footer className="zx-footer">
          <div className="zx-footer-inner">
            <div>
              <div className="zx-brand" style={{ fontSize: 15 }}>
                <Logo className="h-6 w-6" />
                知行
              </div>
              <p style={{ marginTop: 12, maxWidth: "22rem" }}>
                基于 RAG 的 AI 知识管理与智能求职平台，部署在阿里云服务器上。
              </p>
            </div>

            <div>
              <h3>产品</h3>
              <ul>
                <li>
                  <Link href="/#features">功能特性</Link>
                </li>
                <li>
                  <Link href="/#how">如何使用</Link>
                </li>
                <li>
                  <Link href="/dashboard">控制台</Link>
                </li>
              </ul>
            </div>

            <div>
              <h3>关于</h3>
              <ul>
                <li>
                  <Link href="/about">项目介绍</Link>
                </li>
                <li>
                  <Link href="/login">登录</Link>
                </li>
                <li>Next.js · Prisma · pgvector</li>
              </ul>
            </div>
          </div>

          <div className="zx-footer-bottom">
            © {new Date().getFullYear()} 知行 ZhiXing · 全栈 AI 知识管理与智能求职平台
          </div>
        </footer>
      </div>

      <LandingReveal />
    </div>
  );
}
