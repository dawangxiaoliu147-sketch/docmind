import type { Metadata } from "next";
import { LandingNav } from "@/components/landing-nav";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "关于 · 文档生活助手",
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingNav />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            关于 文档生活助手
          </h1>
          <p className="mt-3 text-zinc-500 dark:text-zinc-400">
            一个用于学习与实践 RAG（检索增强生成）技术的全栈 AI 知识库项目。
          </p>

          <div className="mt-10 space-y-8">
            <section>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                项目背景
              </h2>
              <p className="mt-2 leading-relaxed text-zinc-600 dark:text-zinc-400">
                通用大模型只能回答训练数据里已有的知识，无法访问你的私有文档，且容易"幻觉"。
                文档生活助手 通过检索增强生成技术，让大模型基于你上传的文档作答，
                每条回答都能追溯到具体片段，从而把大模型变成真正可用的私有知识助手。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                技术架构
              </h2>
              <ul className="mt-3 space-y-2 text-zinc-600 dark:text-zinc-400">
                <li>🖥️ 前端：Next.js 16（App Router）+ React 19 + Tailwind CSS</li>
                <li>🗄️ 数据：Prisma 7 + PostgreSQL + pgvector（向量检索）</li>
                <li>🔐 认证：JWT 无状态会话（jose）+ bcrypt 密码哈希</li>
                <li>🤖 AI：Vercel AI SDK + OpenAI 兼容接口（对话/嵌入模型解耦）</li>
                <li>☁️ 部署：Docker + docker-compose + Kubernetes + GitHub Actions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                核心流程
              </h2>
              <div className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 font-mono text-sm leading-relaxed text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                上传文档 → 解析文本 → 智能分块 → 向量化
                <br />
                ↓
                <br />
                用户提问 → 向量化问题 → 语义检索 Top-K
                <br />
                ↓
                <br />
                拼装上下文 + 提示词 → 大模型流式生成 → 标注引用来源
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
