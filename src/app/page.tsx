import Link from "next/link";
import type { CSSProperties } from "react";
import { Logo } from "@/components/logo";
import { LandingReveal } from "@/components/landing-reveal";

// 给 reveal 元素挂错峰延迟
const d = (s: string) => ({ "--d": s }) as CSSProperties;

const FEATURES = [
  {
    icon: "◈",
    title: "RAG 知识库问答",
    desc: "文档解析、带重叠分块、向量化入库；提问先检索最相关的 Top-K 片段，再让模型基于片段作答。",
    tag: "pgvector",
  },
  {
    icon: "≋",
    title: "混合检索",
    desc: "语义向量 + 关键词双路召回后去重合并。型号、人名这类专有名词，关键词命中反而更准。",
    tag: "hybrid",
  },
  {
    icon: "✦",
    title: "多角色 Agent",
    desc: "知识库 6 个角色：问答、总结、深度研究、出题、翻译、写作。模型可自主调用工具多步推理。",
    tag: "tools",
  },
  {
    icon: "⊞",
    title: "简历工坊",
    desc: "8 套模板的所见即所得编辑器，A4 实时排版与页数校验，支持撤回恢复，导出 PDF 或 HTML。",
    tag: "8 layouts",
  },
  {
    icon: "◐",
    title: "简历智能体",
    desc: "上传多份资料或图片，一句话让它直接改在简历上；模板与主题色可自动套用，改动可一键撤回。",
    tag: "multimodal",
  },
  {
    icon: "⬢",
    title: "求职助手",
    desc: "职位库支持 CSV 批量导入；简历与 JD 匹配打分、生成面试题、按简历推荐岗位。",
    tag: "jobs",
  },
  {
    icon: "⊹",
    title: "知识图谱",
    desc: "自动梳理文档结构，生成层级图谱，看清知识之间的关联与脉络。",
    tag: "graph",
  },
  {
    icon: "⊡",
    title: "桌面宠物智能体",
    desc: "右下角常驻的助手，跨模块查数据、改简历、答问题，不用来回切换页面。",
    tag: "agent",
  },
  {
    icon: "↯",
    title: "容器化部署",
    desc: "四阶段 Docker 镜像 + Compose 编排，GitHub Actions 构建推送镜像，推送即部署。",
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
  { num: "01", title: "创建知识库", desc: "按主题建库，上传封面、挑一个主题色，几十秒搞定。" },
  { num: "02", title: "上传资料", desc: "PDF、Word、Markdown、CSV 均可，自动解析、打标签、分块入库。" },
  { num: "03", title: "开始提问", desc: "用自然语言提问，先检索再作答并标出出处；还能出题、画图谱、改简历。" },
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

// 热力格强度（固定 pattern，确定性，不随机）
const HEAT = [2, 0, 3, 1, 0, 2, 1, 3, 1, 0, 2, 3, 0, 1, 2, 0, 1, 3, 2, 0, 1, 2, 3, 1, 0, 2, 0, 1];
const HEAT_CLASS = ["", "l1", "l2", "l3"];

export default function LandingPage() {
  return (
    <div className="zx-landing">
      {/* 固定背板：雨林层叠山脊 + 雾光。内联 SVG，零外链零 CORS */}
      <svg
        className="zx-backdrop"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="zxSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#08130e" />
            <stop offset="38%" stopColor="#0b1e15" />
            <stop offset="68%" stopColor="#0f3a28" />
            <stop offset="100%" stopColor="#226a3b" />
          </linearGradient>
          <radialGradient id="zxSun" cx="62%" cy="68%" r="46%">
            <stop offset="0%" stopColor="#cdeca6" stopOpacity="0.30" />
            <stop offset="45%" stopColor="#7fc98a" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#7fc98a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="zxTop" cx="50%" cy="-6%" r="70%">
            <stop offset="0%" stopColor="#d7ef83" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#d7ef83" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="zxR1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1d4a33" />
            <stop offset="100%" stopColor="#0e2a1e" />
          </linearGradient>
          <linearGradient id="zxR2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#123524" />
            <stop offset="100%" stopColor="#081b13" />
          </linearGradient>
          <linearGradient id="zxR3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a1c14" />
            <stop offset="100%" stopColor="#040e09" />
          </linearGradient>
          <linearGradient id="zxMist" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#bfe6c8" stopOpacity="0" />
            <stop offset="50%" stopColor="#bfe6c8" stopOpacity="0.13" />
            <stop offset="100%" stopColor="#bfe6c8" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect width="1920" height="1080" fill="url(#zxSky)" />
        <rect width="1920" height="1080" fill="url(#zxSun)" />
        <rect width="1920" height="1080" fill="url(#zxTop)" />

        {/* 星点 / 萤火 */}
        <g fill="#e6f5d0">
          <circle cx="180" cy="110" r="1.5" opacity="0.42" />
          <circle cx="420" cy="176" r="1.2" opacity="0.3" />
          <circle cx="700" cy="96" r="1.6" opacity="0.38" />
          <circle cx="980" cy="160" r="1.1" opacity="0.26" />
          <circle cx="1260" cy="104" r="1.5" opacity="0.34" />
          <circle cx="1520" cy="190" r="1.2" opacity="0.28" />
          <circle cx="1760" cy="120" r="1.4" opacity="0.32" />
          <circle cx="300" cy="262" r="1.3" opacity="0.24" />
          <circle cx="1120" cy="256" r="1.5" opacity="0.28" />
          <circle cx="1660" cy="300" r="1.2" opacity="0.22" />
        </g>

        {/* 远山脊 */}
        <path
          d="M0 612 L180 512 L340 584 L520 470 L700 566 L880 498 L1080 596 L1280 502 L1480 588 L1680 518 L1920 600 L1920 1080 L0 1080 Z"
          fill="url(#zxR1)"
          opacity="0.9"
        />
        <rect y="580" width="1920" height="150" fill="url(#zxMist)" />

        {/* 中景 */}
        <path
          d="M0 762 L220 658 L420 742 L640 638 L880 752 L1120 656 L1360 760 L1600 676 L1920 776 L1920 1080 L0 1080 Z"
          fill="url(#zxR2)"
        />
        <rect y="720" width="1920" height="170" fill="url(#zxMist)" opacity="0.8" />

        {/* 前景 */}
        <path
          d="M0 918 L250 836 L500 916 L790 826 L1090 926 L1380 844 L1680 932 L1920 874 L1920 1080 L0 1080 Z"
          fill="url(#zxR3)"
        />

        {/* 飘浮微粒 */}
        <g fill="#d7ef83">
          <circle cx="460" cy="470" r="2" opacity="0.20" />
          <circle cx="760" cy="548" r="1.5" opacity="0.16" />
          <circle cx="1080" cy="430" r="1.8" opacity="0.18" />
          <circle cx="1340" cy="520" r="1.4" opacity="0.14" />
          <circle cx="1620" cy="452" r="2" opacity="0.18" />
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
              <Link href="/#screens">界面</Link>
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
                <em>变成能回答问题的知识库</em>
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
              <span className="zx-eyebrow">核心功能</span>
              <h2 className="zx-h2">从一份文档，到一条完整的知识链路</h2>
              <p className="zx-sub">检索、问答、出题、图谱、简历、岗位，都长在同一个知识库上。</p>
            </div>

            <div className="zx-feats">
              {FEATURES.map((f, i) => (
                <article key={f.title} className="zx-feat zx-reveal" style={d(`${(i % 3) * 0.05}s`)}>
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

          {/* ---------- 界面一览（设备格子） ---------- */}
          <section id="screens" className="zx-section">
            <div className="zx-section-head zx-reveal">
              <span className="zx-eyebrow">界面一览</span>
              <h2 className="zx-h2">一个产品，几个面</h2>
              <p className="zx-sub">控制台、知识库、简历工坊 —— 同一套设计语言，跨设备一致。</p>
            </div>

            <div className="zx-screens">
              {/* 手机 1 · 控制台 */}
              <figure className="zx-screen-fig zx-reveal">
                <div className="zx-phone">
                  <div className="zx-notch" aria-hidden="true" />
                  <div className="zx-screen">
                    <div className="zx-status">
                      <span>9:41</span>
                      <span className="zx-sig" aria-hidden="true">
                        <i />
                        <i />
                        <i />
                        <i />
                      </span>
                    </div>
                    <div className="zx-screen-body">
                      <div>
                        <div className="zx-ph-greet">晚上好，知行</div>
                        <div className="zx-ph-date">2026-09-17 · 周三</div>
                      </div>
                      <div className="zx-ph-card">
                        <span className="zx-ph-chip">今日</span>
                        <div className="zx-ph-big">128</div>
                        <div className="zx-ph-meta">AI 调用 · 配额 300 次</div>
                        <div className="zx-ph-bar">
                          <i style={{ width: "43%" }} />
                        </div>
                      </div>
                      <div className="zx-ph-card">
                        <div className="zx-ph-row">
                          <span className="zx-ph-dot on">✓</span>
                          <span>产品手册.pdf</span>
                          <em>12 块</em>
                        </div>
                        <div className="zx-ph-row">
                          <span className="zx-ph-dot on">✓</span>
                          <span>员工手册.docx</span>
                          <em>8 块</em>
                        </div>
                        <div className="zx-ph-row">
                          <span className="zx-ph-dot" />
                          <span>行业报告.md</span>
                          <em>解析中</em>
                        </div>
                      </div>
                    </div>
                    <div className="zx-ph-nav">
                      <span className="on">控制台</span>
                      <span>知识库</span>
                      <span>简历</span>
                      <span>我的</span>
                    </div>
                  </div>
                </div>
                <figcaption className="zx-screen-cap">
                  <b>控制台</b> · 用量与数据总览
                </figcaption>
              </figure>

              {/* 手机 2 · 知识库 */}
              <figure className="zx-screen-fig zx-reveal" style={d("0.08s")}>
                <div className="zx-phone">
                  <div className="zx-notch" aria-hidden="true" />
                  <div className="zx-screen">
                    <div className="zx-status">
                      <span>9:41</span>
                      <span className="zx-sig" aria-hidden="true">
                        <i />
                        <i />
                        <i />
                        <i />
                      </span>
                    </div>
                    <div className="zx-screen-body">
                      <div>
                        <div className="zx-ph-greet">知识库</div>
                        <div className="zx-ph-date">3 个库 · 24 份文档</div>
                      </div>
                      <div className="zx-ph-card">
                        <span className="zx-ph-chip">检索</span>
                        <div className="zx-ph-meta">语义 + 关键词 · Top-K 4</div>
                        <div className="zx-ph-bar">
                          <i style={{ width: "72%" }} />
                        </div>
                      </div>
                      <div className="zx-ph-card">
                        <div className="zx-ph-row">
                          <span className="zx-ph-dot on">✓</span>
                          <span>产品手册</span>
                          <em>9 份</em>
                        </div>
                        <div className="zx-ph-row">
                          <span className="zx-ph-dot on">✓</span>
                          <span>求职资料</span>
                          <em>12 份</em>
                        </div>
                        <div className="zx-ph-row">
                          <span className="zx-ph-dot on">✓</span>
                          <span>学习笔记</span>
                          <em>3 份</em>
                        </div>
                      </div>
                    </div>
                    <div className="zx-ph-nav">
                      <span>控制台</span>
                      <span className="on">知识库</span>
                      <span>简历</span>
                      <span>我的</span>
                    </div>
                  </div>
                </div>
                <figcaption className="zx-screen-cap">
                  <b>知识库</b> · 多库隔离与混合检索
                </figcaption>
              </figure>

              {/* 手机 3 · 简历工坊 */}
              <figure className="zx-screen-fig zx-reveal" style={d("0.16s")}>
                <div className="zx-phone">
                  <div className="zx-notch" aria-hidden="true" />
                  <div className="zx-screen">
                    <div className="zx-status">
                      <span>9:41</span>
                      <span className="zx-sig" aria-hidden="true">
                        <i />
                        <i />
                        <i />
                        <i />
                      </span>
                    </div>
                    <div className="zx-screen-body">
                      <div>
                        <div className="zx-ph-greet">简历工坊</div>
                        <div className="zx-ph-date">8 套模板 · A4 实时排版</div>
                      </div>
                      <div className="zx-ph-card">
                        <div className="zx-ph-heat" aria-hidden="true">
                          {HEAT.map((lv, i) => (
                            <i
                              key={i}
                              className={`${HEAT_CLASS[lv]} ${i === 17 ? "today" : ""}`.trim()}
                            />
                          ))}
                        </div>
                        <div className="zx-ph-meta">已启用 6 套 · 当前「缎带标签」</div>
                      </div>
                      <div className="zx-ph-card">
                        <div className="zx-ph-row">
                          <span className="zx-ph-dot on">✓</span>
                          <span>撤回 / 恢复</span>
                          <em>50 步</em>
                        </div>
                        <div className="zx-ph-row">
                          <span className="zx-ph-dot on">✓</span>
                          <span>导出 PDF / HTML</span>
                        </div>
                        <div className="zx-ph-cta">导出简历</div>
                      </div>
                    </div>
                    <div className="zx-ph-nav">
                      <span>控制台</span>
                      <span>知识库</span>
                      <span className="on">简历</span>
                      <span>我的</span>
                    </div>
                  </div>
                </div>
                <figcaption className="zx-screen-cap">
                  <b>简历工坊</b> · 模板、排版与导出
                </figcaption>
              </figure>
            </div>
          </section>

          {/* ---------- 如何使用 ---------- */}
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
                注册后提交申请，管理员开通即可使用。数据存在自己部署的服务上。
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
              <Link href="/" className="zx-brand">
                <Logo className="h-6 w-6" />
                知行
              </Link>
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
                  <Link href="/#screens">界面一览</Link>
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
          <div className="zx-footer-bottom">© {new Date().getFullYear()} 知行 ZhiXing</div>
        </footer>
      </div>

      <LandingReveal />
    </div>
  );
}
