"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
      return `## ${m.role === "user" ? "🙋 用户" : "🤖 AI"}\n\n${text}`;
    });
    const md = `# 文档生活助手 对话记录\n\n> 导出时间：${new Date().toLocaleString()}\n\n${lines.join("\n\n")}`;
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `文档生活助手对话-${new Date().toISOString().slice(0, 10)}.md`;
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
    <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* 顶栏 */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-2.5 dark:border-zinc-800">
        <span className="text-xs text-zinc-400 dark:text-zinc-500">对话</span>
        <button
          onClick={exportMarkdown}
          disabled={messages.length === 0}
          className="text-xs font-medium text-zinc-500 transition hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ⬇️ 导出 Markdown
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 text-4xl">💬</div>
            <p className="text-lg font-medium text-zinc-700 dark:text-zinc-200">
              向你的知识库提问
            </p>
            <p className="mt-1 max-w-sm text-sm text-zinc-400 dark:text-zinc-500">
              试试下面这些，或直接输入你的问题
            </p>

            <div className="mt-5 flex max-w-md flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="rounded-full border border-zinc-200 px-3.5 py-1.5 text-xs text-zinc-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-indigo-700 dark:hover:bg-indigo-950 dark:hover:text-indigo-300"
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              onClick={() => setSuggestions(shuffled(buildPool(docTitles)).slice(0, 4))}
              className="mt-3 text-xs text-zinc-400 transition hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
            >
              🔄 换一批
            </button>
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
                  <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-indigo-600 px-4 py-3 text-sm leading-relaxed text-white">
                    {text}
                  </div>
                ) : (
                  <div className="markdown max-w-[88%] rounded-2xl rounded-bl-sm bg-zinc-100 px-4 py-3 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {text}
                    </ReactMarkdown>
                    <button
                      onClick={() => speak(text)}
                      className="mt-2 text-xs text-zinc-400 transition hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                      title="朗读这段回答"
                    >
                      🔊 朗读
                    </button>
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

      {sources.length > 0 && !busy && (
        <div className="border-t border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <p className="mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            📌 参考来源（点击查看原文）
          </p>
          <div className="space-y-2">
            {sources.map((s, i) => (
              <details key={s.id} className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/50">
                <summary className="flex cursor-pointer items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  <span>片段 {i + 1} · 相似度 {(s.similarity * 100).toFixed(0)}%</span>
                  {s.docId && (
                    <a
                      href={`/kb/${kbId}/docs/${s.docId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      查看原文 ↗
                    </a>
                  )}
                </summary>
                <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {s.content}
                </p>
              </details>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="border-t border-red-100 bg-red-50 px-5 py-2 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          出错了：{error.message || "请稍后重试"}
        </p>
      )}

      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 border-t border-zinc-200 p-4 dark:border-zinc-800"
      >
        <button
          type="button"
          onClick={startVoice}
          title="语音输入"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-lg transition ${
            listening
              ? "border-red-400 bg-red-50 dark:bg-red-950/40"
              : "border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          }`}
        >
          {listening ? "🎙️" : "🎤"}
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入你的问题，回车发送…"
          className="flex-1 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-indigo-500 dark:focus:ring-indigo-900"
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
