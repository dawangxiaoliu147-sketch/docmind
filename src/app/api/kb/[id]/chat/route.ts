import {
  streamText,
  convertToModelMessages,
  tool,
  isStepCount,
  generateText,
} from "ai";
import type { UIMessage } from "ai";
import { z } from "zod";
import { chatModel, embedText } from "@/lib/ai";
import { searchChunks } from "@/lib/vector";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { getAgentSystemPrompt } from "@/lib/agents";

export async function POST(
  req: Request,
  ctx: RouteContext<"/api/kb/[id]/chat">,
) {
  const { id } = await ctx.params;

  // 1. 鉴权
  const session = await verifySession();
  if (!session) {
    return new Response("未登录", { status: 401 });
  }

  // 2. 校验知识库归属，并确认存在可用文档
  const kb = await prisma.knowledgeBase.findFirst({
    where: { id, userId: session.userId },
    include: {
      documents: {
        where: { status: "ready" },
        select: { id: true },
      },
    },
  });
  if (!kb) {
    return new Response("知识库不存在或无权访问", { status: 404 });
  }
  if (kb.documents.length === 0) {
    return new Response("该知识库还没有已处理的文档，请先上传文档", {
      status: 400,
    });
  }

  // 3. 解析消息并取出用户最新提问
  const body = await req.json();
  const uiMessages: UIMessage[] = Array.isArray(body?.messages)
    ? body.messages
    : [];
  const modelMessages = await convertToModelMessages(uiMessages);

  const lastUser = [...modelMessages]
    .reverse()
    .find((m) => m.role === "user");
  const query = extractText(lastUser?.content);
  if (!query.trim()) {
    return new Response("请输入问题", { status: 400 });
  }

  const url = new URL(req.url);

  // 4. 解析/创建对话
  const conversationId = url.searchParams.get("conversationId") ?? "";
  let convId = conversationId;
  if (convId) {
    const existing = await prisma.conversation.findFirst({
      where: { id: convId, userId: session.userId, kbId: id },
    });
    if (!existing) {
      const created = await prisma.conversation.create({
        data: {
          id: convId,
          kbId: id,
          userId: session.userId,
          title: query.slice(0, 40),
        },
      });
      convId = created.id;
    }
  } else {
    const created = await prisma.conversation.create({
      data: { kbId: id, userId: session.userId, title: query.slice(0, 40) },
    });
    convId = created.id;
  }

  // 保存用户消息
  try {
    await prisma.message.create({
      data: { conversationId: convId, role: "user", content: query },
    });
  } catch {
    // 保存失败不阻断
  }

  // 当前 Agent 角色
  const agentMode = url.searchParams.get("agent") ?? "assistant";

  // 5. Agent 工具箱：模型可自主决定调用哪些工具、调用几次
  const tools = {
    searchKnowledgeBase: tool({
      description:
        "在知识库中做语义检索，返回与查询最相关的文档片段。回答用户问题前应该先调用它查资料。",
      inputSchema: z.object({
        query: z.string().describe("要检索的问题或关键词"),
      }),
      execute: async ({ query: q }) => {
        const embedding = await embedText(q);
        const chunks = await searchChunks(id, embedding, 4);
        if (chunks.length === 0) {
          return "知识库中没有检索到相关内容。";
        }
        return chunks
          .map((c, i) => `【片段 ${i + 1}】${c.content}`)
          .join("\n\n");
      },
    }),

    listDocuments: tool({
      description: "列出知识库中的所有文档（含 id、标题、状态）。",
      inputSchema: z.object({}),
      execute: async () => {
        const docs = await prisma.document.findMany({
          where: { kbId: id },
          select: { id: true, title: true, status: true },
        });
        if (docs.length === 0) return "知识库中还没有文档。";
        return docs
          .map(
            (d) =>
              `- id: ${d.id}\n  标题: ${d.title}（${d.status === "ready" ? "已就绪" : d.status}）`,
          )
          .join("\n");
      },
    }),

    readDocument: tool({
      description: "读取某个文档的完整内容（需要先通过 listDocuments 获取文档 id）。",
      inputSchema: z.object({
        docId: z.string().describe("文档 id"),
      }),
      execute: async ({ docId }) => {
        const doc = await prisma.document.findFirst({
          where: { id: docId, kbId: id },
        });
        if (!doc) return "未找到该文档，请用 listDocuments 确认文档 id。";
        const chunks = await prisma.chunk.findMany({
          where: { docId },
          orderBy: { chunkIndex: "asc" },
          select: { content: true },
        });
        if (chunks.length === 0) return "该文档暂无内容。";
        return chunks
          .map((c, i) => `【${doc.title} · 片段 ${i + 1}】${c.content}`)
          .join("\n\n")
          .slice(0, 10000);
      },
    }),

    summarizeDocument: tool({
      description: "总结某个文档的核心内容（需要文档 id）。",
      inputSchema: z.object({
        docId: z.string().describe("文档 id"),
      }),
      execute: async ({ docId }) => {
        const doc = await prisma.document.findFirst({
          where: { id: docId, kbId: id },
        });
        if (!doc) return "未找到该文档，请用 listDocuments 确认文档 id。";
        const chunks = await prisma.chunk.findMany({
          where: { docId },
          take: 30,
          select: { content: true },
        });
        const content = chunks.map((c) => c.content).join("\n\n").slice(0, 8000);
        const result = await generateText({
          model: chatModel,
          system: "你是总结助手，请简洁总结资料。",
          prompt: `请用中文总结以下文档的核心内容，分 3~5 点：\n\n${content}`,
        });
        return result.text;
      },
    }),

    generateQuiz: tool({
      description: "根据知识库内容生成几道选择题，用来考用户。",
      inputSchema: z.object({}),
      execute: async () => {
        const chunks = await prisma.chunk.findMany({
          where: { kbId: id },
          take: 8,
          select: { content: true },
        });
        const material = chunks.map((c) => c.content).join("\n\n").slice(0, 8000);
        const result = await generateText({
          model: chatModel,
          prompt: `根据资料生成 3 道选择题，格式如下（每道题后紧跟答案）：\n1. 题目\nA. 选项 B. 选项 C. 选项 D. 选项\n答案：X\n\n资料：\n${material}`,
        });
        return result.text;
      },
    }),
  };

  // 6. Agent 流式生成：允许最多 8 步（含多次工具调用）
  const result = streamText({
    model: chatModel,
    system: getAgentSystemPrompt(agentMode),
    messages: modelMessages,
    tools,
    stopWhen: isStepCount(8),
    onFinish: async ({ text }) => {
      try {
        await prisma.message.create({
          data: { conversationId: convId, role: "assistant", content: text },
        });
        await prisma.conversation.update({
          where: { id: convId },
          data: { updatedAt: new Date() },
        });
      } catch {
        // 忽略保存失败
      }
    },
  });

  return result.toUIMessageStreamResponse();
}

// 从消息 content（string 或 parts 数组）中提取纯文本
function extractText(
  content: string | Array<{ type?: string; text?: string }> | undefined,
): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((p) => p.text ?? "").join("");
  }
  return "";
}
