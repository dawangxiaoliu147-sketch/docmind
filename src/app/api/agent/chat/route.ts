import { streamText, convertToModelMessages, tool, isStepCount } from "ai";
import type { UIMessage } from "ai";
import { z } from "zod";
import { chatModel } from "@/lib/ai";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { aiQuota } from "@/lib/guard";
import { getAllJobs } from "@/lib/job-store";

// 「知行智能体」：一个通用 Agent Harness
// 通过工具注册表把项目的各项能力暴露给模型，模型自主编排、多步推理。
export async function POST(req: Request) {
  const session = await verifySession();
  if (!session) {
    return new Response("未登录", { status: 401 });
  }

  // 配额：Agent 支持多步工具调用，一次请求可能花掉多次模型调用，必须限住
  const limited = aiQuota(session.userId);
  if (limited) return limited;

  const body = await req.json();
  const uiMessages: UIMessage[] = Array.isArray(body?.messages) ? body.messages : [];
  const modelMessages = await convertToModelMessages(uiMessages);

  const tools = {
    listKnowledgeBases: tool({
      description: "列出当前用户的全部知识库（含 id）",
      inputSchema: z.object({}),
      execute: async () => {
        const kbs = await prisma.knowledgeBase.findMany({
          where: { userId: session.userId },
          select: { id: true, name: true },
        });
        return kbs.length
          ? kbs.map((k) => `- ${k.name}（id: ${k.id}）`).join("\n")
          : "用户还没有创建知识库";
      },
    }),

    searchKnowledge: tool({
      description: "在用户的全部知识库中按关键词检索内容，返回相关片段",
      inputSchema: z.object({ query: z.string().describe("检索关键词") }),
      execute: async ({ query }) => {
        const kbs = await prisma.knowledgeBase.findMany({
          where: { userId: session.userId },
          select: { id: true, name: true },
        });
        if (kbs.length === 0) return "用户还没有知识库";
        const nameMap = new Map(kbs.map((k) => [k.id, k.name]));
        const chunks = await prisma.chunk.findMany({
          where: {
            kbId: { in: kbs.map((k) => k.id) },
            content: { contains: query, mode: "insensitive" },
          },
          take: 5,
          select: { content: true, kbId: true, document: { select: { title: true } } },
        });
        if (chunks.length === 0) return "没有检索到相关内容";
        return chunks
          .map(
            (c) =>
              `【${nameMap.get(c.kbId) ?? ""} · ${c.document.title}】\n${c.content.slice(0, 200)}`,
          )
          .join("\n\n");
      },
    }),

    listJobs: tool({
      description: "查询职位库，可按关键词（职位名/技能）筛选",
      inputSchema: z.object({ keyword: z.string().optional().describe("关键词，可留空") }),
      execute: async ({ keyword }) => {
        const jobs = await getAllJobs();
        const kw = keyword?.trim();
        const filtered = kw
          ? jobs.filter(
              (j) =>
                j.title.includes(kw) ||
                j.company.includes(kw) ||
                j.tags.some((t) => t.includes(kw)),
            )
          : jobs;
        if (filtered.length === 0) return "没有匹配的职位";
        return filtered
          .slice(0, 10)
          .map((j) => `- ${j.title} @ ${j.company}｜${j.salary}｜${j.location}｜${j.tags.join("/")}`)
          .join("\n");
      },
    }),

    listDocuments: tool({
      description: "列出某个知识库里的文档标题（需要知识库 id）",
      inputSchema: z.object({ kbId: z.string() }),
      execute: async ({ kbId }) => {
        const kb = await prisma.knowledgeBase.findFirst({
          where: { id: kbId, userId: session.userId },
        });
        if (!kb) return "知识库不存在或无权访问";
        const docs = await prisma.document.findMany({
          where: { kbId },
          select: { title: true, status: true, tags: true },
        });
        return docs.length
          ? docs
              .map((d) => `- ${d.title}（${d.status}）${d.tags.length ? `#${d.tags.join(" #")}` : ""}`)
              .join("\n")
          : "该知识库还没有文档";
      },
    }),

    stats: tool({
      description: "统计用户的整体数据（知识库数、文档数、片段数、对话数）",
      inputSchema: z.object({}),
      execute: async () => {
        const kbs = await prisma.knowledgeBase.findMany({
          where: { userId: session.userId },
          select: { id: true },
        });
        const kbIds = kbs.map((k) => k.id);
        const [docs, chunks, convs] = await Promise.all([
          prisma.document.count({ where: { kbId: { in: kbIds } } }),
          prisma.chunk.count({ where: { kbId: { in: kbIds } } }),
          prisma.conversation.count({ where: { userId: session.userId } }),
        ]);
        return `知识库 ${kbs.length} 个 · 文档 ${docs} 个 · 知识片段 ${chunks} 条 · 对话 ${convs} 次`;
      },
    }),
  };

  const result = streamText({
    model: chatModel,
    system:
      "你是「知行」的通用智能体（Agent Harness）。你可以自主调用工具来帮用户完成任务：查询知识库、检索资料、查职位、统计数据等。" +
      "接到任务后先思考需要哪些信息，再决定调用哪些工具、调用几次；可组合多个工具。用简洁中文回答，基于工具返回的真实数据，不要编造。",
    messages: modelMessages,
    tools,
    stopWhen: isStepCount(6),
  });

  return result.toUIMessageStreamResponse();
}
