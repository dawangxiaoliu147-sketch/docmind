"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AgentMascot } from "@/components/agent-mascot";

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
    <div className="flex h-[calc(100vh-10rem)] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-100 px-5 py-3 dark:border-zinc-800">
        <span className="flex items-center gap-2 text-sm font-semibold dark:text-zinc-100">
          <AgentMascot className="h-6 w-6" />
          知行智能体
        </span>
        <span className="ml-2 text-xs text-zinc-400 dark:text-zinc-500">
          可自主调用工具完成任务
        </span>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3">
              <AgentMascot className="h-16 w-16" />
            </div>
            <p className="text-lg font-medium text-zinc-700 dark:text-zinc-200">
              你好，我是知行智能体
            </p>
            <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
              我能查知识库、找职位、做统计…试试下面的问题
            </p>
            <div className="mt-5 flex max-w-md flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="rounded-full border border-zinc-200 px-3.5 py-1.5 text-xs text-zinc-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-indigo-700 dark:hover:bg-indigo-950 dark:hover:text-indigo-300"
                >
                  {s}
                </button>
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
                  <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-indigo-600 px-4 py-3 text-sm leading-relaxed text-white">
                    {t}
                  </div>
                ) : (
                  <div className="markdown max-w-[88%] rounded-2xl rounded-bl-sm bg-zinc-100 px-4 py-3 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{t}</ReactMarkdown>
                  </div>
                )}
              </div>
            );
          })
        )}

        {busy && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-zinc-100 px-4 py-3 dark:bg-zinc-800">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:300ms]" />
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
        className="flex items-center gap-3 border-t border-zinc-200 p-4 dark:border-zinc-800"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入任务，智能体会自主调用工具…"
          className="flex-1 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          发送
        </button>
      </form>
    </div>
  );
}
