import Link from "next/link";
import { LandingNav } from "@/components/landing-nav";
import { Footer } from "@/components/footer";

const FEATURES = [
  {
    icon: "📄",
    title: "文档解析入库",
    desc: "上传 PDF / Markdown / TXT，自动提取文本、智能分块、向量化存储。",
  },
  {
    icon: "🔍",
    title: "语义检索",
    desc: "基于 pgvector 余弦相似度，从海量文档中精准找到最相关的片段。",
  },
  {
    icon: "💬",
    title: "流式 AI 问答",
    desc: "针对你的知识库提问，大模型基于事实逐字流式作答。",
  },
  {
    icon: "📌",
    title: "引用溯源",
    desc: "每条回答都标注引用片段，能追溯答案依据，拒绝瞎编。",
  },
  {
    icon: "🗂️",
    title: "多知识库隔离",
    desc: "按主题创建多个知识库，文档相互隔离、权限归属校验。",
  },
  {
    icon: "☁️",
    title: "云原生部署",
    desc: "Docker 容器化 + Kubernetes 编排 + CI/CD，一键部署。",
  },
];

const STEPS = [
  { num: "01", title: "创建知识库", desc: "注册账号，按主题创建你的知识库，可上传封面图。" },
  { num: "02", title: "上传文档", desc: "把 PDF、Markdown 或 TXT 拖进来，自动解析并向量化。" },
  { num: "03", title: "提问获取答案", desc: "针对文档提问，AI 检索相关内容并流式回答，附引用来源。" },
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
  "Kubernetes",
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-white dark:from-indigo-950/40 dark:via-zinc-950 dark:to-zinc-950">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-300">
                ✨ 基于 RAG 检索增强生成
              </span>
              <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
                让你的文档，
                <br />
                <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  开口回答问题
                </span>
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                上传你的 PDF、Markdown、TXT，DocMind 自动解析并向量化，让你用自然语言向自己的知识库提问，回答可溯源、不瞎编。
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  免费开始使用
                </Link>
                <Link
                  href="/#how"
                  className="rounded-xl border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  了解如何工作
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-3xl bg-gradient-to-tr from-indigo-200/60 via-violet-200/40 to-pink-200/40 blur-2xl dark:from-indigo-900/40 dark:via-violet-900/30 dark:to-pink-900/30" />
              <div className="relative space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-sm text-white">
                    D
                  </span>
                  <span className="text-sm font-semibold dark:text-zinc-100">知识库 · 产品手册</span>
                </div>

                <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-indigo-600 px-4 py-2.5 text-sm text-white">
                  年假可以结转多少天？
                </div>

                <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-zinc-100 px-4 py-3 text-sm leading-relaxed text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                  根据《员工手册》，年假未用完可结转至次年，最多结转{" "}
                  <strong>5 天</strong>。
                  <div className="mt-2 space-y-1">
                    <div className="rounded-lg bg-white px-3 py-1.5 text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                      📌 参考：片段 2 —— 员工每年享有 10 天带薪年假…
                    </div>
                    <div className="rounded-lg bg-white px-3 py-1.5 text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                      📌 参考：片段 5 —— 年假未用完可结转至次年，最多结转 5 天
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 亮点数据 */}
        <section className="border-y border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 text-center md:grid-cols-4">
            {[
              { v: "12+", l: "AI 工作 Agent" },
              { v: "6", l: "知识库角色" },
              { v: "混合", l: "语义+关键词检索" },
              { v: "100%", l: "引用可溯源" },
            ].map((s) => (
              <div key={s.l}>
                <p className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-3xl font-bold text-transparent">
                  {s.v}
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{s.l}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 功能特性 */}
        <section id="features" className="mx-auto max-w-6xl px-4 py-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">核心功能</h2>
            <p className="mt-3 text-zinc-500 dark:text-zinc-400">
              从文档到答案，一条完整的 RAG 流水线
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-zinc-200 bg-white p-6 transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-800"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-2xl transition group-hover:scale-110 dark:bg-indigo-950">
                  {f.icon}
                </div>
                <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 三步使用 */}
        <section id="how" className="bg-zinc-50 py-20 dark:bg-zinc-900/40">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">三步开始</h2>
              <p className="mt-3 text-zinc-500 dark:text-zinc-400">无需训练模型，文档即知识</p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {STEPS.map((s) => (
                <div
                  key={s.num}
                  className="relative rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-4xl font-black text-transparent">
                    {s.num}
                  </span>
                  <h3 className="mt-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 技术栈 */}
        <section className="mx-auto max-w-6xl px-4 py-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">技术栈</h2>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">现代全栈 + 云原生</p>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {TECH_STACK.map((t) => (
              <span
                key={t}
                className="rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              >
                {t}
              </span>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
