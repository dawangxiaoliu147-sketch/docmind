import Link from "next/link";
import type { CSSProperties } from "react";
import { Logo } from "@/components/logo";
import { LandingReveal } from "@/components/landing-reveal";

// 给 reveal 元素挂错峰延迟
const d = (s: string) => ({ "--d": s }) as CSSProperties;

const PULSE = [
  { icon: "◈", v: "13", l: "工作台 Agent" },
  { icon: "≋", v: "6", l: "知识库角色" },
  { icon: "⊞", v: "8", l: "简历模板" },
];

const LOOP = [
  { icon: "↯", title: "入库", copy: "上传 PDF / Word / Markdown，自动解析分块" },
  { icon: "◈", title: "提问", copy: "先检索最相关片段，再让模型基于片段作答" },
  { icon: "⊞", title: "落地", copy: "顺手改简历、匹配岗位、生成面试题" },
];

const STEPS = [
  { n: "01", t: "创建知识库", p: "按主题建库，上传封面、挑一个场景，几十秒搞定。" },
  { n: "02", t: "上传资料", p: "PDF、Word、Markdown、CSV 均可，自动解析、打标签、分块入库。" },
  { n: "03", t: "开始提问", p: "用自然语言提问，先检索再作答并标出出处。" },
];

const TECH = [
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
      <div className="zx-shell">
        {/* ─────────── 首屏 ─────────── */}
        <section className="zx-hero">
          <div className="zx-hero-overlay" aria-hidden="true" />

          <nav className="zx-hero-nav" aria-label="首页导航">
            <Link href="/" className="zx-brand">
              <span className="zx-brand-mark">
                <Logo className="h-5 w-5" />
              </span>
              知行
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Link
                href="/login"
                style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,.75)" }}
              >
                登录
              </Link>
              <Link
                href="/dashboard"
                className="btn-ghost-pill"
                style={{ padding: "0.5rem 1.1rem", fontSize: 13 }}
              >
                进入控制台
              </Link>
            </div>
          </nav>

          <div className="zx-hero-body">
            <div className="product-enter">
              <div className="zx-badge zx-reveal">
                <i>✦</i>基于 RAG 检索增强生成
              </div>

              <h1 className="zx-h1 zx-reveal" style={d("0.06s")}>
                把散落的资料，
                <br />
                <em>变成能回答问题的知识库</em>
              </h1>

              <p className="zx-lead zx-reveal" style={d("0.12s")}>
                上传 PDF、Word、Markdown，自动解析、分块、向量化入库。提问时先检索最相关的片段，
                再让模型基于这些片段作答，并标出出处 —— 答案有据可查，不是凭空生成。
              </p>

              <div className="zx-hero-cta zx-reveal" style={d("0.18s")}>
                <Link href="/register" className="btn-sticker">
                  免费开始 <span aria-hidden="true">→</span>
                </Link>
                <Link href="/#features" className="btn-ghost-pill">
                  向下探索 <span aria-hidden="true">↓</span>
                </Link>
              </div>

              <div className="zx-pulse zx-reveal" style={d("0.24s")}>
                {PULSE.map((p) => (
                  <div key={p.l} className="zx-pulse-cell">
                    <span className="zx-pulse-icon" aria-hidden="true">
                      {p.icon}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <b>{p.v}</b>
                      <span>{p.l}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="zx-hero-foot">
                <i aria-hidden="true">✓</i>
                数据存在你自己部署的服务上，随时开始，随时回看
              </div>
            </div>
          </div>
        </section>

        {/* ─────────── 功能 ─────────── */}
        <section id="features" className="zx-band">
          <div className="zx-inner">
            <div className="zx-head zx-reveal">
              <div>
                <p className="zx-head-label">一张工作台，完成整个知识闭环</p>
                <h2 className="zx-h2">
                  少一点来回切换，
                  <br />
                  多一点真正的<em>专注</em>
                </h2>
              </div>
              <p className="zx-head-desc">
                资料不是孤立的文件。知行把文档入库、语义检索、AI 问答、简历工坊与岗位匹配
                连成一条链路，让你问一个问题就能拿到有出处的答案。
              </p>
            </div>

            {/* 假 App 界面（用真实 DOM 搭，不是图片） */}
            <div className="zx-mock zx-reveal">
              <div className="zx-mock-bar">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="dot" />
                  <span className="t">知识库 · 产品手册</span>
                </div>
                <span className="d">pgvector · 余弦 Top-K 4</span>
              </div>

              <div className="zx-mock-body">
                {/* 左栏 */}
                <aside className="zx-mock-side">
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,.35)" }}>
                    进行中的知识库
                  </p>
                  <div
                    style={{
                      marginTop: 18,
                      borderLeft: "2px solid var(--primary)",
                      paddingLeft: 14,
                    }}
                  >
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>产品手册</p>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,.38)" }}>
                      24 份文档 · 312 片段
                    </p>
                  </div>
                  <div
                    style={{
                      marginTop: 26,
                      display: "flex",
                      flexDirection: "column",
                      gap: 14,
                      fontSize: 12.5,
                      color: "rgba(255,255,255,.42)",
                    }}
                  >
                    <span style={{ color: "rgba(255,255,255,.82)" }}>◈ 智能问答</span>
                    <span>≋ 混合检索</span>
                    <span>⊹ 知识图谱</span>
                    <span>◐ 知识闪卡</span>
                  </div>
                </aside>

                {/* 中栏：问答 */}
                <div className="zx-mock-main">
                  <div>
                    <p style={{ margin: 0, fontSize: 12, color: "var(--primary)" }}>
                      检索到 4 个相关片段
                    </p>
                    <h3 style={{ margin: "8px 0 0", fontSize: 20, fontWeight: 600, color: "#fff" }}>
                      年假可以结转多少天？
                    </h3>

                    <div
                      style={{
                        marginTop: 20,
                        borderTop: "1px solid rgba(255,255,255,.1)",
                        borderBottom: "1px solid rgba(255,255,255,.1)",
                        padding: "16px 0",
                        fontSize: 14,
                        lineHeight: 1.8,
                        color: "rgba(255,255,255,.75)",
                      }}
                    >
                      根据《员工手册》，年假未用完可结转至次年，最多结转{" "}
                      <strong style={{ color: "var(--primary)" }}>5 天</strong>。
                      <div
                        style={{
                          marginTop: 12,
                          borderLeft: "2px solid color-mix(in srgb, var(--primary) 55%, transparent)",
                          paddingLeft: 12,
                          fontSize: 12,
                          color: "rgba(255,255,255,.42)",
                        }}
                      >
                        片段 2 · 员工每年享有 10 天带薪年假
                        <br />
                        片段 5 · 年假未用完可结转至次年，最多 5 天
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 24,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 18, color: "var(--primary)" }}>◈</span>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>混合检索</p>
                        <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,.36)" }}>
                          语义 + 关键词去重合并
                        </p>
                      </div>
                    </div>
                    <span
                      style={{
                        background: "var(--primary)",
                        color: "var(--primary-foreground)",
                        padding: "8px 16px",
                        fontSize: 12,
                        fontWeight: 600,
                        borderRadius: 9999,
                      }}
                    >
                      提问
                    </span>
                  </div>
                </div>

                {/* 右栏 */}
                <aside className="zx-mock-aside">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        display: "flex",
                        width: 34,
                        height: 34,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 9999,
                        background: "color-mix(in srgb, var(--primary) 14%, transparent)",
                        color: "var(--primary)",
                        fontSize: 16,
                      }}
                    >
                      ✦
                    </span>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>知行智能体</p>
                      <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,.34)" }}>
                        已注册 5 个工具 · 最多 6 步
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 22,
                      fontSize: 13,
                      lineHeight: 1.75,
                      color: "rgba(255,255,255,.62)",
                    }}
                  >
                    <p style={{ margin: 0 }}>
                      我在你的知识库里检索到 4 个相关片段，并标注了出处。需要我把这段结论整理进简历吗？
                    </p>
                    <div
                      style={{
                        marginTop: 16,
                        borderLeft: "1px solid color-mix(in srgb, var(--primary) 60%, transparent)",
                        paddingLeft: 14,
                      }}
                    >
                      <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,.35)" }}>
                        下一步建议
                      </p>
                      <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,.76)", fontSize: 13 }}>
                        把「产品手册」里的项目经历提炼进简历项目经历。
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 24,
                      display: "flex",
                      height: 42,
                      alignItems: "center",
                      gap: 10,
                      border: "1px solid rgba(255,255,255,.12)",
                      background: "rgba(255,255,255,.035)",
                      padding: "0 12px",
                      borderRadius: 6,
                    }}
                  >
                    <span style={{ flex: 1, fontSize: 12, color: "rgba(255,255,255,.28)" }}>
                      问问知行下一步做什么…
                    </span>
                    <span style={{ color: "var(--primary)", fontSize: 13 }}>➤</span>
                  </div>
                </aside>
              </div>
            </div>

            {/* 三栏发丝分隔 */}
            <div className="zx-rowgrid zx-reveal">
              {LOOP.map((x) => (
                <div key={x.title}>
                  <i aria-hidden="true">{x.icon}</i>
                  <div>
                    <p>{x.title}</p>
                    <span>{x.copy}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─────────── 如何使用 + 技术栈 ─────────── */}
        <section className="zx-band">
          <div className="zx-inner">
            <div className="zx-head zx-reveal">
              <div>
                <p className="zx-head-label">三步开始，不用训练模型</p>
                <h2 className="zx-h2">
                  文档即知识，
                  <br />
                  上传什么就<em>回答什么</em>
                </h2>
              </div>
              <p className="zx-head-desc">
                所有数据留在你自己部署的服务上。检索到的片段会随答案一起给出，随时可以核对原文。
              </p>
            </div>

            <div className="zx-steps zx-reveal">
              {STEPS.map((s) => (
                <div key={s.n} className="zx-step">
                  <b>{s.n}</b>
                  <h3>{s.t}</h3>
                  <p>{s.p}</p>
                </div>
              ))}
            </div>

            <p className="zx-tech zx-reveal">
              {TECH.map((t, i) => (
                <span key={t}>
                  {t}
                  {i < TECH.length - 1 && <i>·</i>}
                </span>
              ))}
            </p>
          </div>
        </section>

        {/* ─────────── 收尾 CTA ─────────── */}
        <section className="zx-cta-band">
          <div className="zx-cta-inner zx-reveal">
            <h2>把散落的资料，变成随时能问的知识库</h2>
            <p>注册后提交申请，管理员开通即可使用。数据存在自己部署的服务上。</p>
            <div className="zx-cta-actions">
              <Link href="/register" className="btn-sticker">
                免费开始 <span aria-hidden="true">→</span>
              </Link>
              <Link href="/login" className="btn-ghost-pill">
                已有账号，去登录
              </Link>
            </div>
          </div>
        </section>

        {/* ─────────── 页脚 ─────────── */}
        <footer className="zx-footer">
          <div className="zx-footer-inner">
            <div>
              <Link href="/" className="zx-brand">
                <span className="zx-brand-mark">
                  <Logo className="h-5 w-5" />
                </span>
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
                  <Link href="/dashboard">控制台</Link>
                </li>
                <li>
                  <Link href="/login">登录</Link>
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
                  <Link href="/register">申请访问</Link>
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
