import type { Metadata } from "next";
import { LandingNav } from "@/components/landing-nav";
import { Footer } from "@/components/footer";
import { IconBox, Panel, ScenicBackdrop } from "@/components/ui";

export const metadata: Metadata = {
  title: "关于 · 知行",
};

// 技术栈清单：图标一律用单调 Unicode（彩色 emoji 不服从 CSS color，会破坏场景配色）
const STACK = [
  { icon: "⊞", text: "前端：Next.js 16（App Router）+ React 19 + Tailwind CSS" },
  { icon: "⬡", text: "数据：Prisma 7 + PostgreSQL + pgvector（向量检索）" },
  { icon: "◈", text: "认证：JWT 无状态会话（jose）+ bcrypt 密码哈希" },
  { icon: "✦", text: "AI：Vercel AI SDK + OpenAI 兼容接口（对话/嵌入模型解耦）" },
  { icon: "≋", text: "部署：Docker + docker-compose + Kubernetes + GitHub Actions" },
];

export default function AboutPage() {
  return (
    <div className="ui-shell has-scenic ui-scene-fade flex min-h-screen flex-col">
      <ScenicBackdrop veil="strong" />
      <LandingNav />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <p className="ui-eyebrow">about</p>
          <h1 className="ui-title">关于 知行</h1>
          <p className="ui-subtitle">
            一个用于学习与实践 RAG（检索增强生成）技术的全栈 AI 知识库项目。
          </p>

          <div className="mt-10 flex flex-col gap-8">
            <section>
              <h2 className="ui-section-title">项目背景</h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-fg2">
                通用大模型只能回答训练数据里已有的知识，无法访问你的私有文档，且容易“幻觉”。
                知行 通过检索增强生成技术，让大模型基于你上传的文档作答，
                每条回答都能追溯到具体片段，从而把大模型变成真正可用的私有知识助手。
              </p>
            </section>

            <section>
              <h2 className="ui-section-title">技术架构</h2>
              <ul className="mt-3 flex flex-col gap-2.5">
                {STACK.map((s) => (
                  <li key={s.icon} className="flex items-start gap-2.5 text-[13.5px] text-fg2">
                    <IconBox size="sm">{s.icon}</IconBox>
                    <span className="leading-relaxed">{s.text}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="ui-section-title">核心流程</h2>
              <Panel className="num mt-3 p-4 text-[12.5px] leading-relaxed text-fg2">
                上传文档 → 解析文本 → 智能分块 → 向量化
                <br />
                ↓
                <br />
                用户提问 → 向量化问题 → 语义检索 Top-K
                <br />
                ↓
                <br />
                拼装上下文 + 提示词 → 大模型流式生成 → 标注引用来源
              </Panel>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
