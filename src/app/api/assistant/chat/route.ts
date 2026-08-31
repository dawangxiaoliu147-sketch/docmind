import { streamText, convertToModelMessages } from "ai";
import type { UIMessage } from "ai";
import { chatModel } from "@/lib/ai";
import { verifySession } from "@/lib/dal";
import { getWorkAgent, WORK_AGENTS } from "@/lib/work-agents";

// 工作台通用 Agent 聊天（不依赖知识库）
export async function POST(req: Request) {
  const session = await verifySession();
  if (!session) {
    return new Response("未登录", { status: 401 });
  }

  const url = new URL(req.url);
  const agentId = url.searchParams.get("agent") ?? WORK_AGENTS[0].id;
  const agent = getWorkAgent(agentId) ?? WORK_AGENTS[0];

  const body = await req.json();
  const uiMessages: UIMessage[] = Array.isArray(body?.messages)
    ? body.messages
    : [];
  const modelMessages = await convertToModelMessages(uiMessages);

  const result = streamText({
    model: chatModel,
    system: agent.systemPrompt,
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse();
}
