"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AgentMascot } from "@/components/agent-mascot";
import { Button, Input, Panel } from "@/components/ui";

type TextPart = { type: string; text?: string };
function msgText(m: { parts: TextPart[] }): string {
  return m.parts.filter((p) => p.type === "text").map((p) => p.text ?? "").join("");
}

const SUGGESTIONS = [
  "我有哪些知识库和文档？",
  "帮我查前端相关职位",
  "在我的知识库里搜「年假」",
  "统计一下我的数据",
];

export function AgentPanel() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/agent/chat" }),
  });
  const busy = status === "submitted" || status === "streaming";

  function ask(t: string) {
    if (!t.trim() || busy) return;
    sendMessage({ text: t });
    setInput("");
  }

  return (
    <Panel className="flex h-[calc(100vh-10rem)] flex-col overflow-hidden">
      <div className="border-b border-border px-5 py-3" data-tour="agent-toolbar">
        <span className="flex items-center gap-2 text-sm font-semibold text-fg">
          <AgentMascot className="h-6 w-6" />
          知行智能体
        </span>
        <span className="ml-2 text-xs text-muted-fg">
          可自主调用工具完成任务
        </span>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3">
              <AgentMascot className="h-16 w-16" />
            </div>
            <p className="text-lg font-medium text-fg">
              你好，我是知行智能体
            </p>
            <p className="mt-1 text-sm text-muted-fg">
              我能查知识库、找职位、做统计…试试下面的问题
            </p>
            <div className="mt-5 flex max-w-md flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <Button key={s} size="sm" variant="outline" onClick={() => ask(s)}>
                  {s}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const t = msgText(m);
            if (!t) return null;
            const isUser = m.role === "user";
            return (
              <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                {isUser ? (
                  <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-sm leading-relaxed text-primary-fg">
                    {t}
                  </div>
                ) : (
                  <div className="markdown glass max-w-[88%] rounded-2xl rounded-bl-sm px-4 py-3 text-fg2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{t}</ReactMarkdown>
                  </div>
                )}
              </div>
            );
          })
        )}

        {busy && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-surface px-4 py-3">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-fg [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-fg [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-fg [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex items-center gap-3 border-t border-border p-4"
        data-tour="agent-input"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入任务，智能体会自主调用工具…"
          className="flex-1"
        />
        <Button type="submit" pill disabled={busy || !input.trim()}>
          发送
        </Button>
      </form>
    </Panel>
  );
}
