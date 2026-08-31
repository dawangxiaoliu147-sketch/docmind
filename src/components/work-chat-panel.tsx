"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type TextPart = { type: string; text?: string };
type Attachment = { fileName: string; text: string };

function messageText(message: { parts: TextPart[] }): string {
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");
}

export function WorkChatPanel({
  agentId,
  agentName,
  agentIcon,
}: {
  agentId: string;
  agentName: string;
  agentIcon: string;
}) {
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: `/api/assistant/chat?agent=${agentId}`,
    }),
  });

  const busy = status === "submitted" || status === "streaming";

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/assistant/upload", {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (!res.ok) {
        setUploadError(json.error ?? "上传失败");
      } else {
        setAttachment({ fileName: json.fileName, text: json.text });
      }
    } catch {
      setUploadError("上传失败，请重试");
    } finally {
      setUploading(false);
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;

    let message = text;
    if (attachment) {
      message = `以下是我上传的文件「${attachment.fileName}」的内容：\n\n${attachment.text}\n\n我的问题/需求：${text}`;
    }
    sendMessage({ text: message });
    setInput("");
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2 border-b border-zinc-100 px-5 py-3 dark:border-zinc-800">
        <span className="text-xl">{agentIcon}</span>
        <span className="font-semibold dark:text-zinc-100">{agentName}</span>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 text-4xl">{agentIcon}</div>
            <p className="text-lg font-medium text-zinc-700 dark:text-zinc-200">
              {agentName}已就绪
            </p>
            <p className="mt-1 max-w-sm text-sm text-zinc-400 dark:text-zinc-500">
              可以上传文件（简历、报告等），或直接输入需求
            </p>
          </div>
        )}

        {messages.map((m) => {
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
                </div>
              )}
            </div>
          );
        })}

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

      {error && (
        <p className="border-t border-red-100 bg-red-50 px-5 py-2 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          出错了：{error.message || "请稍后重试"}
        </p>
      )}

      {/* 已上传文件提示 */}
      {attachment && (
        <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-2 dark:border-zinc-800">
          <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
            📎 已附加：{attachment.fileName}
          </span>
          <button
            type="button"
            onClick={() => setAttachment(null)}
            className="ml-2 shrink-0 text-xs text-zinc-400 transition hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400"
          >
            移除
          </button>
        </div>
      )}
      {uploadError && (
        <p className="px-5 py-1 text-xs text-red-600 dark:text-red-400">
          {uploadError}
        </p>
      )}

      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 border-t border-zinc-200 p-4 dark:border-zinc-800"
      >
        <label className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-zinc-300 text-lg transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
          {uploading ? "⏳" : "📎"}
          <input
            type="file"
            accept=".pdf,.md,.txt,.markdown,.docx,.html,.htm,.csv,application/pdf,text/plain,text/markdown,text/html,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={onUpload}
            disabled={uploading}
          />
        </label>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入你的需求…"
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
