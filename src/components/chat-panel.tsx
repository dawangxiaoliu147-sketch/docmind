"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Alert, Button, IconBox, Input, Panel, Tooltip } from "@/components/ui";

type TextPart = { type: string; text?: string };
type Source = { id: string; docId?: string; content: string; similarity: number };

const GENERIC_QUESTIONS = [
  "总结这个知识库的核心内容",
  "给我列出几个关键要点",
  "这个知识库里最重要的信息是什么？",
];

function messageText(message: { parts: TextPart[] }): string {
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");
}

function buildPool(docTitles: string[]): string[] {
  const fromDocs = docTitles.map((t) => `「${t}」主要讲了什么？`);
  return [...fromDocs, ...GENERIC_QUESTIONS];
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function ChatPanel({
  kbId,
  conversationId,
  initialMessages,
  onCreated,
  docTitles,
  agentMode,
}: {
  kbId: string;
  conversationId: string;
  initialMessages: UIMessage[];
  onCreated: (id: string, title: string) => void;
  docTitles: string[];
  agentMode: string;
}) {
  const [input, setInput] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [sentOnce, setSentOnce] = useState(false);
  const [suggestions, setSuggestions] = useState(() =>
    shuffled(buildPool(docTitles)).slice(0, 4),
  );
  const [listening, setListening] = useState(false);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: `/api/kb/${kbId}/chat?conversationId=${conversationId}&agent=${agentMode}`,
    }),
    messages: initialMessages,
  });

  const busy = status === "submitted" || status === "streaming";

  function ask(text: string) {
    if (!text || busy) return;
    sendMessage({ text });
    if (!sentOnce) {
      onCreated(conversationId, text.slice(0, 30));
      setSentOnce(true);
    }
    setInput("");
    fetchSources(text);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    ask(input);
  }

  async function fetchSources(query: string) {
    try {
      const res = await fetch(
        `/api/kb/${kbId}/search?q=${encodeURIComponent(query)}`,
      );
      const json = await res.json();
      setSources(Array.isArray(json.chunks) ? json.chunks : []);
    } catch {
      setSources([]);
    }
  }

  function exportMarkdown() {
    const lines = messages.map((m) => {
      const text = messageText(m);
      return `## ${m.role === "user" ? " 用户" : " AI"}\n\n${text}`;
    });
    const md = `# 知行 对话记录\n\n> 导出时间：${new Date().toLocaleString()}\n\n${lines.join("\n\n")}`;
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `知行对话-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function speak(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    u.rate = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  function startVoice() {
    const w = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onstart: () => void;
        onend: () => void;
        onresult: (e: { results: Array<Array<{ transcript: string }>> }) => void;
        onerror: () => void;
        start: () => void;
      };
      webkitSpeechRecognition?: new () => unknown;
    };
    const SR = w.SpeechRecognition ?? (w.webkitSpeechRecognition as never);
    if (!SR) return;
    const rec = new SR();
    rec.lang = "zh-CN";
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onresult = (e) => setInput(e.results[0][0].transcript);
    rec.onerror = () => setListening(false);
    rec.start();
  }

  return (
    <Panel className="flex flex-1 flex-col overflow-hidden">
      {/* 顶栏 */}
      <div className="flex items-center justify-between border-b border-border px-5 py-2.5">
        <span className="text-xs text-muted-fg">对话</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={exportMarkdown}
          disabled={messages.length === 0}
        >
          ↓ 导出 Markdown
        </Button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <IconBox size="lg" className="mb-3">◈</IconBox>
            <p className="text-lg font-medium text-fg">
              向你的知识库提问
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-fg">
              试试下面这些，或直接输入你的问题
            </p>

            <div className="mt-5 flex max-w-md flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <Button key={s} size="sm" variant="outline" onClick={() => ask(s)}>
                  {s}
                </Button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 text-muted-fg"
              onClick={() => setSuggestions(shuffled(buildPool(docTitles)).slice(0, 4))}
            >
              ≋ 换一批
            </Button>
          </div>
        ) : (
          messages.map((m) => {
            const text = messageText(m);
            if (!text) return null;
            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                {isUser ? (
                  <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-sm leading-relaxed text-primary-fg">
                    {text}
                  </div>
                ) : (
                  <div className="markdown glass max-w-[88%] rounded-2xl rounded-bl-sm px-4 py-3 text-fg2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {text}
                    </ReactMarkdown>
                    <Tooltip label="朗读这段回答">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-muted-fg"
                        onClick={() => speak(text)}
                      >
                        ◎ 朗读
                      </Button>
                    </Tooltip>
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

      {sources.length > 0 && !busy && (
        <div className="border-t border-border px-5 py-4">
          <p className="mb-2 text-xs font-semibold text-muted-fg">
            ◈ 参考来源（点击查看原文）
          </p>
          <div className="space-y-2">
            {sources.map((s, i) => (
              <details key={s.id} className="rounded-lg bg-muted px-3 py-2">
                <summary className="flex cursor-pointer items-center gap-2 text-xs font-medium text-fg2">
                  <span className="num">片段 {i + 1} · 相似度 {(s.similarity * 100).toFixed(0)}%</span>
                  {s.docId && (
                    <a
                      href={`/kb/${kbId}/docs/${s.docId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      查看原文 ↗
                    </a>
                  )}
                </summary>
                <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-muted-fg">
                  {s.content}
                </p>
              </details>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="border-t border-border p-2">
          <Alert tone="error">
            出错了：{error.message || "请稍后重试"}
          </Alert>
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 border-t border-border p-4"
      >
        <Tooltip label="语音输入">
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label="语音输入"
            onClick={startVoice}
            className={listening ? "border-destructive text-destructive-fg" : undefined}
          >
            {listening ? "●" : "◎"}
          </Button>
        </Tooltip>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入你的问题，回车发送…"
          className="flex-1"
        />
        <Button type="submit" pill disabled={busy || !input.trim()}>
          发送
        </Button>
      </form>
    </Panel>
  );
}
