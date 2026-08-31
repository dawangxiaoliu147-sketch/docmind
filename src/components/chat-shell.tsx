"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UIMessage } from "ai";
import { ChatPanel } from "./chat-panel";
import { AGENT_MODES } from "@/lib/agents";

type ConvSummary = { id: string; title: string; updatedAt: Date | string };

export function ChatShell({
  kbId,
  conversations,
  initialConvId,
  initialMessages,
  docTitles,
  agentMode,
}: {
  kbId: string;
  conversations: ConvSummary[];
  initialConvId: string;
  initialMessages: UIMessage[];
  docTitles: string[];
  agentMode: string;
}) {
  const router = useRouter();
  const [extra, setExtra] = useState<ConvSummary[]>([]);

  const list = [
    ...extra,
    ...conversations.filter((c) => !extra.some((e) => e.id === c.id)),
  ];

  function newChat() {
    router.push(`?conv=${crypto.randomUUID()}&agent=${agentMode}`);
  }

  function select(id: string) {
    router.push(`?conv=${id}&agent=${agentMode}`);
  }

  function changeAgent(mode: string) {
    if (initialConvId) {
      router.push(`?conv=${initialConvId}&agent=${mode}`);
    } else {
      router.push(`?agent=${mode}`);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    if (id === initialConvId) {
      router.push(`/kb/${kbId}/chat`);
    } else {
      router.refresh();
    }
  }

  function onCreated(id: string, title: string) {
    setExtra((prev) =>
      prev.some((c) => c.id === id)
        ? prev
        : [{ id, title, updatedAt: new Date().toISOString() }, ...prev],
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <aside className="flex w-60 shrink-0 flex-col border-r border-zinc-200 pr-3 dark:border-zinc-800">
        <button
          onClick={newChat}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          ＋ 新建对话
        </button>
        <div className="mt-3 flex-1 space-y-1 overflow-y-auto">
          {list.length === 0 && (
            <p className="px-2 text-xs text-zinc-400 dark:text-zinc-500">
              暂无历史对话
            </p>
          )}
          {list.map((c) => (
            <div
              key={c.id}
              className={`group flex items-center rounded-lg px-2 py-2 text-sm ${
                initialConvId === c.id
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              <button
                onClick={() => select(c.id)}
                className="min-w-0 flex-1 truncate text-left"
              >
                {c.title}
              </button>
              <button
                onClick={() => remove(c.id)}
                className="ml-1 hidden shrink-0 text-xs text-zinc-400 hover:text-red-600 group-hover:inline dark:text-zinc-500 dark:hover:text-red-400"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </aside>

      <div className="flex flex-1 flex-col pl-4">
        {/* Agent 角色选择器 */}
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            Agent 角色
          </span>
          <select
            value={agentMode}
            onChange={(e) => changeAgent(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm outline-none transition focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            {AGENT_MODES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.icon} {m.name} · {m.description}
              </option>
            ))}
          </select>
        </div>

        {initialConvId ? (
          <ChatPanel
            key={`${initialConvId}-${agentMode}`}
            kbId={kbId}
            conversationId={initialConvId}
            initialMessages={initialMessages}
            onCreated={onCreated}
            docTitles={docTitles}
            agentMode={agentMode}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-zinc-400 dark:text-zinc-500">
            点击「新建对话」开始提问，或在左侧选择历史对话
          </div>
        )}
      </div>
    </div>
  );
}
