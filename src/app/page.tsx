import Link from "next/link";
import type { CSSProperties } from "react";
import { Logo } from "@/components/logo";
import { LandingReveal } from "@/components/landing-reveal";

// 给 reveal 元素挂错峰延迟
const d = (s: string) => ({ "--d": s }) as CSSProperties;

const FEATURES = [
  {
    title: "RAG 知识库问答",
    desc: "文档解析、带重叠分块、向量化入库；提问时先检索最相关的 Top-K 片段，再让模型基于片段作答，并标注引用来源。",
  },
  {
    title: "混合检索",
    desc: "语义向量 + 关键词双路召回后去重合并。型号、人名这类专有名词，关键词命中反而更准。",
  },
  {
    title: "多角色 Agent",
    desc: "知识库内置 6 个角色：问答、总结、深度研究、出题、翻译、写作。模型可自主调用检索、读文档等工具，多步推理。",
  },
  {
    title: "简历工坊",
    desc: "8 套模板的所见即所得编辑器，A4 实时排版与页数校验，支持撤回恢复，导出 PDF 或 HTML。",
  },
  {
    title: "简历智能体",
    desc: "上传多份资料或图片，一句话让它直接改在简历上；模板与主题色可自动套用，改动可一键撤回。",
  },
  {
    title: "求职助手",
    desc: "职位库支持 CSV 批量导入；简历与 JD 匹配打分、生成面试题、按简历推荐岗位。",
  },
  {
    title: "知识图谱",
    desc: "自动梳理文档结构，生成层级图谱，看清知识之间的关联与脉络。",
  },
  {
    title: "桌面宠物智能体",
    desc: "右下角常驻的助手，跨模块查数据、改简历、答问题，不用来回切换页面。",
  },
  {
    title: "容器化部署",
    desc: "四阶段 Docker 镜像 + Compose 编排，GitHub Actions 构建推送镜像，推送即部署。",
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
    desc: "按主题建库，上传封面、选一个主题色。",
  },
  {
    num: "02",
    title: "上传资料",
    desc: "PDF、Word、Markdown、CSV 均可，自动解析、打标签、分块入库。",
  },
  {
    num: "03",
    title: "开始提问",
    desc: "用自然语言提问，先检索再作答并给出出处。",
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
      {/* 固定背板：中性渐变 + 一抹极淡顶光。内联 SVG，零外链 */}
      <svg
        className="zx-backdrop"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="zxSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#101216" />
            <stop offset="55%" stopColor="#0b0c0f" />
            <stop offset="100%" stopColor="#0a0b0d" />
          </linearGradient>
          <radialGradient id="zxGlow" cx="50%" cy="-8%" r="72%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.055" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1920" height="1080" fill="url(#zxSky)" />
        <rect width="1920" height="1080" fill="url(#zxGlow)" />
      </svg>

      <div className="zx-grain" aria-hidden="true" />

      <div className="zx-shell">
        {/* ---------- 顶部导航 ---------- */}
        <header className="zx-nav">
          <nav className="zx-nav-inner">
            <Link href="/" className="zx-brand">
              <Logo className="h-6 w-6" />
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
              <span className="zx-eyebrow zx-reveal">RAG · 检索增强生成</span>
              <h1 className="zx-h1 zx-reveal" style={d("0.05s")}>
                把散落的资料
                <br />
                <span>变成能回答问题的知识库</span>
              </h1>
              <p className="zx-lead zx-reveal" style={d("0.1s")}>
                上传 PDF、Word、Markdown，自动解析、分块、向量化入库。提问时先检索最相关的片段，
                再让模型基于这些片段作答，并标出出处 —— 答案有据可查，不是凭空生成。
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

            {/* 一段真实对话记录 —— 不是聊天卡片，是内容 */}
            <div className="zx-transcript zx-reveal" style={d("0.18s")}>
              <div className="zx-t-label">知识库 · 产品手册</div>
              <div className="zx-t-q">年假可以结转多少天？</div>
              <div className="zx-t-a">
                根据《员工手册》，年假未用完可结转至次年，最多结转 <strong>5 天</strong>。
                <div className="zx-t-cite">片段 2 · 员工每年享有 10 天带薪年假</div>
                <div className="zx-t-cite">片段 5 · 年假未用完可结转至次年，最多 5 天</div>
              </div>
            </div>
          </section>

          {/* ---------- 指标 ---------- */}
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

          {/* ---------- 功能 ---------- */}
          <section id="features" className="zx-section">
            <div className="zx-section-head zx-reveal">
              <span className="zx-sec-index">01 — 功能</span>
              <h2 className="zx-h2">一条链路，从文档到答案</h2>
              <p className="zx-sub">
                检索、问答、出题、图谱、简历、岗位，都长在同一个知识库上。
              </p>
            </div>

            <ul className="zx-list">
              {FEATURES.map((f, i) => (
                <li
                  key={f.title}
                  className="zx-item zx-reveal"
                  style={d(`${(i % 2) * 0.05}s`)}
                >
                  <span className="zx-item-n">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{f.title}</h3>
                    <p>{f.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* ---------- 如何使用 ---------- */}
          <section id="how" className="zx-section">
            <div className="zx-section-head zx-reveal">
              <span className="zx-sec-index">02 — 如何使用</span>
              <h2 className="zx-h2">三步，不用训练模型</h2>
              <p className="zx-sub">文档即知识。上传什么，它就能回答什么。</p>
            </div>

            <div className="zx-steps">
              {STEPS.map((s, i) => (
                <div key={s.num} className="zx-step zx-reveal" style={d(`${i * 0.06}s`)}>
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
              <span className="zx-sec-index">03 — 技术栈</span>
              <h2 className="zx-h2">现代全栈 + 容器化交付</h2>
            </div>
            <p className="zx-tech zx-reveal">
              {TECH_STACK.map((t, i) => (
                <span key={t}>
                  {t}
                  {i < TECH_STACK.length - 1 && <i>·</i>}
                </span>
              ))}
            </p>
          </section>

          {/* ---------- 结尾 ---------- */}
          <section className="zx-cta">
            <div className="zx-cta-inner zx-reveal">
              <div>
                <h2 className="zx-h2">部署一份属于你自己的知识库</h2>
                <p className="zx-sub">
                  注册后提交申请，管理员开通即可使用。所有数据存在自己部署的服务上。
                </p>
              </div>
              <div className="zx-cta-actions">
                <Link href="/register" className="zx-btn zx-btn-primary">
                  免费开始使用
                </Link>
                <Link href="/login" className="zx-btn zx-btn-outline">
                  去登录
                </Link>
              </div>
            </div>
          </section>
        </main>

        {/* ---------- 页脚 ---------- */}
        <footer className="zx-footer">
          <div className="zx-footer-inner">
            <div>
              <Link href="/" className="zx-brand">
                <Logo className="h-5 w-5" />
                知行
              </Link>
              <p style={{ marginTop: 14, maxWidth: "22rem" }}>
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
            © {new Date().getFullYear()} 知行 ZhiXing
          </div>
        </footer>
      </div>

      <LandingReveal />
    </div>
  );
}
