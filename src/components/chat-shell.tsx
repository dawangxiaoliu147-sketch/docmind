"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UIMessage } from "ai";
import { ChatPanel } from "./chat-panel";
import { AGENT_MODES } from "@/lib/agents";
import { Button, Select, Tooltip } from "@/components/ui";

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
      <aside className="flex w-60 shrink-0 flex-col border-r border-border pr-3">
        <Button onClick={newChat} className="w-full">
          ＋ 新建对话
        </Button>
        <div className="mt-3 flex-1 space-y-1 overflow-y-auto">
          {list.length === 0 && (
            <p className="px-2 text-xs text-muted-fg">
              暂无历史对话
            </p>
          )}
          {list.map((c) => (
            <div
              key={c.id}
              className={`group ui-row text-sm ${
                initialConvId === c.id
                  ? "bg-accent text-primary"
                  : "text-fg2"
              }`}
            >
              <button
                onClick={() => select(c.id)}
                className="min-w-0 flex-1 truncate text-left"
              >
                {c.title}
              </button>
              <Tooltip
                label="删除对话"
                className="ml-1 hidden shrink-0 group-hover:inline-flex"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="删除对话"
                  onClick={() => remove(c.id)}
                >
                  ✕
                </Button>
              </Tooltip>
            </div>
          ))}
        </div>
      </aside>

      <div className="flex flex-1 flex-col pl-4">
        {/* Agent 角色选择器 */}
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs text-muted-fg">
            Agent 角色
          </span>
          <Select
            value={agentMode}
            onChange={(e) => changeAgent(e.target.value)}
          >
            {AGENT_MODES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.icon} {m.name} · {m.description}
              </option>
            ))}
          </Select>
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
          <div className="flex flex-1 items-center justify-center text-sm text-muted-fg">
            点击「新建对话」开始提问，或在左侧选择历史对话
          </div>
        )}
      </div>
    </div>
  );
}
